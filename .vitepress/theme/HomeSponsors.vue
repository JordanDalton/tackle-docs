<script setup lang="ts">
import { VPHomeSponsors } from 'vitepress/theme'
import { homeSponsors } from './sponsors'
</script>

<template>
  <VPHomeSponsors
    message="Laravel Tackle is free and open source, made possible by our sponsors."
    action-text="Become a sponsor"
    action-link="https://github.com/sponsors/JordanDalton"
    :data="homeSponsors"
  />
</template>
