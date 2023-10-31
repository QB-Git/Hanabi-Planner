<script lang="ts" setup>
  import { ref, watchEffect, watch } from 'vue';

  const listDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const props = defineProps({
    show: Boolean,
    anime: Object,
  });

  const emit = defineEmits(['close'])

  const title = ref('');
  const day = ref('#');

  const addAnime = async (e) => {
    await window.app.addAnime(e.target.elements.day.value, e.target.elements.title.value);
    window.refreshList();
    emit('close');
  }

  const editAnime = async (e) => {
    await window.app.editAnime(props.anime?.uuid, e.target.elements.day.value, e.target.elements.title.value);
    window.refreshList();
    emit('close');
  }

  watchEffect(() => {
    title.value = props.anime?.title || '';
    day.value = props.anime?.day || '#';
  });

  watch(() => props.show, (open) => {
    if (open && !props.anime?.value) {
      console.log("eeee", title.value)
      title.value = "";
      day.value = '#';
    }
  });

  
  document.addEventListener('keyup', (e) => {
    if (e.keyCode === 27) {
      emit('close');
    }
  });
</script>

<template>
  <Transition name="modal" @keyup.esc="$emit('close')">
    <div v-if="show" class="modal-mask">
      <div class="modal-container">
        <span class="modal-close" @click="$emit('close')"></span>
        <div class="modal-title">
          {{ anime ? "Éditer": "Ajouter" }} un anime
        </div>
        <form class="modal-content" @submit.prevent="(e) => anime ? editAnime(e) : addAnime(e)">
          <select
            class="add_item__day"
            name="day"
            v-model="day"
          >
            <option value="#" selected>-- Choisir un jour --</option>
            <option v-for="day in listDays">{{ day }}</option>
          </select>
          <div>
            <div class="form-title">Titre</div>
            <input
              class="add_item__title"
              type="text"
              name="title"
              v-model="title"
            >
          </div>
          <button
            type="submit"
            class="button-tertiary"
            :disabled="!title"
          >
            {{ anime ? "Éditer": "Ajouter" }}
          </button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  transition: opacity 0.3s ease;
}

.modal-container {
  background-color: rgba(var(--darker-bg-color-rgb), .99);
  width: 80%;
  border-radius: 1rem;
  position: relative;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  cursor: pointer;
}

.modal-close::before {
  content: "✖";
  font-size: 1.5rem;
  color: #737272;
  text-align: center;
  line-height: 1;
  font-weight: bold;
}

.modal-content {
  display: flex;
  gap: 1rem;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
}

.modal-title {
  font-size: 2.4rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 2rem;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>