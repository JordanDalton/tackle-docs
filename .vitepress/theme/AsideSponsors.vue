<script setup lang="ts">
import { VPDocAsideSponsors } from 'vitepress/theme'
import { asideSponsors } from './sponsors'
</script>

<template>
  <VPDocAsideSponsors :data="asideSponsors" />
</template>
