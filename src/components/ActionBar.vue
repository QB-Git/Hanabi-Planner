<template>
    <div class="container">
        <button class="button-tertiary button-small" @click="showModal = true">Ajouter</button>
    </div>
    <Teleport to="body">
        <Modal :show="showModal" @close="showModal = false" />
    </Teleport>
</template>

<script setup lang="ts">
    import Modal from './Modal.vue'
    import { ref } from 'vue';
    
    const showModal = ref(false);
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    padding: .5rem 1rem;
    border-bottom: 2px solid rgb(36, 38, 42);
    background: rgb(var(--primary-bg-color-rgb));
    height: var(--action-bar-height);
    box-sizing: border-box;
}
</style>
