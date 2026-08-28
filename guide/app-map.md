# The Application Map

Every other coding agent reads your files. Tackle runs inside your booted
application, which means it can ask the framework directly: what columns does
this table actually have, what type is this relationship, which middleware
really runs on this route, what does this FormRequest validate.

The application map is that question, packaged. It replaces a pile of
`ReadFile` calls over models and migrations with one tool call that is both
cheaper and more likely to be right — because a migration file tells you what
someone intended in 2023, and the live connection tells you what is there now.

## Two tiers

**Tier one is an index**, injected into the system prompt of every session:

```
## Application map

Models: Comment(comments) Order(orders) OrderItem(order_items) Post(posts) User(users)
Routes: 47 across 12 controllers.
```

Around sixty tokens, and it removes the most expensive failure mode there is:
an agent spending four tool calls globbing `app/Models` and reading files just
to discover the domain it was about to write code for.

**Tier two is detail on demand**, through two tools the agent calls when it
actually needs the shape of something.

## DescribeModels

```
php artisan tackle:map Post
```

```
Post (posts) · SoftDeletes · Observer: PostObserver · Policy: PostPolicy
App\Models\Post

Columns
  id                       bigint           PK
  user_id                  bigint           FK→users.id
  title                    varchar(255)
  slug                     varchar(255)     UNIQUE
  status                   varchar(32)      default 'draft'
  published_at             timestamp        NULL
  deleted_at               timestamp        NULL

Casts          published_at:datetime  status:PostStatus  meta:array
Fillable       title, slug, body, status, published_at
Appends        excerpt

Relations
  user                 BelongsTo        → User             (user_id)
  comments             HasMany          → Comment          (post_id)
  tags                 BelongsToMany    → Tag

Scopes         published()  draft()  forUser($user)
Global scopes  SoftDeletingScope
Accessors      excerpt
Factory        PostFactory  states: published, draft, withComments
```

Roughly 200 tokens. Reading `Post.php` plus its migrations to get a worse
version of the same picture costs well over a thousand, and misses the
observer entirely — because observers live in the event dispatcher, not in a
property on the model. The same goes for the global scope, which is the line
that tells an agent `Post::count()` does not mean what it looks like.

Everything here comes from somewhere authoritative: columns, types, indexes and
foreign keys from the live connection; casts, fillable and relations from
reflection; observers from the dispatcher; the policy from the gate; the
factory and its states from the factory class.

## DescribeRoute

`ListRoutes` answers *what exists*. `DescribeRoute` answers *what happens*.

```
php artisan tackle:map --route=posts.update
```

```
PUT        /posts/{post}                            posts.update    PostController@update
Middleware   web, auth, can:update,post
             resolves to: EncryptCookies, StartSession, VerifyCsrfToken, SubstituteBindings, Authenticate, Authorize
Bindings     {post}→Post by slug
Authorizes   can:update,post (middleware)  update (called in the controller — read from source, not resolved)

FormRequest  App\Http\Requests\UpdatePostRequest
  title                    required|string|max:255
  slug                     required|unique:posts,slug
```

Middleware groups and aliases are expanded, so `web` becomes the eight classes
it stands for rather than a word the agent has to go and look up in a kernel.

Validation is best-effort by design. `rules()` frequently depends on the
request — `Rule::unique('posts')->ignore($this->route('post'))` cannot be
evaluated outside a request cycle — and when the call fails the map returns the
method's source verbatim with a note saying so:

```
FormRequest  App\Http\Requests\UpdatePostRequest
  rules() depends on the request and could not be evaluated here, so this is its source:
    public function rules(): array
    {
        return [
            'slug' => ['required', Rule::unique('posts')->ignore($this->route('post'))],
        ];
    }
```

Ten lines of a `rules()` body is still cheaper than reading the whole
FormRequest, and it is honest about being unresolved rather than presenting a
guess as an answer.

## Where it pays off

- **`ai:code`** stops hallucinating column names. The map is in the prompt, and
  the detail is one call away.
- **`ai:test`** stops guessing at factory states and column values — the most
  common reason a generated test fails on its first run.
- **`ai:review`** can tell an N+1 from a legitimate lazy load, because it knows
  `$post->comments` is a `HasMany`, and can flag a query against a column that
  does not exist.
- **The healer** resolves `Column not found: 1054 Unknown column 'published'`
  in one tool call instead of four, because the map shows the column is
  `published_at`.

## What it will not do

Three boundaries, all deliberate:

**It returns schema and metadata, never rows.** `QueryDatabase` is the tool for
data and it has its own read-only caps. Keeping that line clean is what makes
the map safe to leave enabled in every environment.

**It never invokes a method to see what comes back.** Relations are read from
declared return types, and only a method already typed as returning a `Relation`
is called. Invoking every public method to find undeclared relations is how an
introspection tool ends up firing `sendWelcomeEmail()`. Models without return
types get an honest note instead:

```
Note: 3 public method(s) declare no return type; any relations among them are
not listed above.
```

Set `probe_untyped_relations` to `true` if your codebase predates return types
and you accept the trade.

**It degrades out loud.** The column list needs a live connection, which a
worktree or a pre-`migrate` checkout may not have. When the schema cannot be
read, the map says so and returns the reflection half:

```
Columns  unavailable — table 'posts' does not exist on this connection (has it been migrated?).
```

Half a map plus an accurate statement about what is missing is useful. Half a
map presented as complete is worse than nothing, because the agent will write
confident code against columns it thinks do not exist.

## Staleness

The map is cached to `storage/tackle/map.json`, keyed on a fingerprint of your
model, migration, and route files. It is flushed when a migration finishes, and
when the agent's own `EditFile` or `WriteFile` touches a model or a migration —
so a change made mid-session is visible on the agent's very next call.

One limitation worth knowing: reflection reads the classes loaded into the
running process. In a [worktree](/guide/configuration#worktree-isolation) the
map describes the booted application's model code, not the worktree's copy of
it. PHP cannot reload a class, so nothing can fix this — the schema half stays
exact, and the reflected metadata is as current as the process that started.

## tackle:map

The same machinery, for humans:

```bash
php artisan tackle:map                      # the index
php artisan tackle:map Post                 # one model, in full
php artisan tackle:map --all                # every model
php artisan tackle:map --route=posts.update # one route
php artisan tackle:map --fresh              # discard the cache and rebuild
```

Useful for warming the cache in CI, and for seeing exactly what your agent sees.

## Configuration

```php
// config/tackle.php
'app_map' => [
    'enabled' => env('AI_CODE_APP_MAP', true),
    'index' => env('AI_CODE_APP_MAP_INDEX', true),
    'cache' => env('AI_CODE_APP_MAP_CACHE', true),
    'probe_untyped_relations' => env('AI_CODE_APP_MAP_PROBE_RELATIONS', false),
],
```

| Key | Default | What it does |
|---|---|---|
| `enabled` | `true` | Master switch. Off also disables the cache-invalidation listeners. |
| `index` | `true` | Inject the tier-one index into every session's system prompt. |
| `cache` | `true` | Persist the map to `storage/tackle/map.json`. Off rebuilds per process. |
| `probe_untyped_relations` | `false` | Detect undeclared relations by invoking methods. Off by default — see above. |

See also: [Built-in Tools](/reference/tools) · [Utility Commands](/reference/commands)
