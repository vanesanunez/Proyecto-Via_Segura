<script>
import AppNavbar from './components/AppNavbar.vue';
import AppFooter from './components/AppFooter.vue';


export default {
    name: 'App',
    components: { AppNavbar, AppFooter,  },
}
</script>

<template>
    <AppNavbar />
    <main class="container mx-auto p-4">
        <RouterView />
    </main>
    <AppFooter />
</template>
