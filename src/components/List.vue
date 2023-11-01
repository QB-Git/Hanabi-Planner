<template>
    <div class="container" >
        <div v-for="day in ['#', ...listDays]" :key="day" :data-day="day">
            <div v-if="weekAnimes[day] && weekAnimes[day].length > 0" class="day">{{ day }}</div>
            <Sortable
                :list="weekAnimes[day]"
                item-key="uuid"
                :options="{
                    animation: 150,
                    ghostClass: 'ghost',
                    dragClass: 'drag',
                    group: 'testgroup',
                    scroll: true,
                    forceFallback: true,
                    bubbleScroll: true,
                }"
            >
                <template #item="{element, index}">
                    <div
                        :ref="() => weekAnimes[day]"
                        :key="element.uuid"
                        class="draggable item"
                        :data-uuid="element.uuid"
                        @contextmenu="addContextualMenuForItem($event, element.uuid)"
                    >
                        <span class="item__title">{{ element.title }}</span>
                        <span class="item__episodes">
                            <!-- <span class="input-number-decrement" @click="decrementEpisodes(anime.episodes, anime.uuid)">–</span> -->
                            <input class="input-number" @input="e => changeEpisodes(e.target.valueAsNumber, element.uuid)" type="number" :value="element.episodes" min="0">
                            <span class="input-number-increment" @click="incrementEpisodes(element.episodes, element.uuid)">＋</span>
                        </span>
                    </div>
                </template>
            </Sortable>
        </div>
    </div>
    <Teleport to="body">
        <Modal :show="showModal" @close="closeModal" :anime="currentEditedAnime" />
    </Teleport>
</template>

<script setup lang="ts">
    import Modal from './Modal.vue';
    import { Sortable } from "sortablejs-vue3";

    import { ref, onMounted } from 'vue';

    const weekAnimes = ref({});
    const listDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const showModal = ref(false);
    const currentEditedAnime = ref({});

    const addContextualMenuForItem = async (event: any, uuid: string) => {
      event.preventDefault();
      await window.app.setContextualMenu(uuid, event.clientX, event.clientY)
    };

    const incrementEpisodes = async (eps: number, uuid: string) => {
        await changeEpisodes(eps + 1, uuid);
    }

    const decrementEpisodes = async (eps: number, uuid: string) => {
        if (eps - 1 >= 0) {
            await changeEpisodes(eps - 1, uuid);
        }
    }

    const changeEpisodes = async (eps: number, uuid: string) => {
        await window.app.setEpisodes(uuid, eps);
        await refreshList();
    }

    const refreshList = async () => {
        const animesRaw = await window.app.getAnimes();
        const animes = Object.keys(animesRaw).map(uuid => ({
            ...animesRaw[uuid],
            uuid: uuid
        }));
        animes.sort((a, b) => a.title.localeCompare(b.title));
        weekAnimes.value = {};
        for (const anime of animes) {
            weekAnimes.value[anime.day] = [...(weekAnimes.value[anime.day] || []), anime];
        }
    }
    window.refreshList = refreshList;

    const editAnime = async (uuid) => {
      currentEditedAnime.value = await window.app.getAnime(uuid);
      currentEditedAnime.value.uuid = uuid;
      showModal.value = true;
    }
    window.editAnime = editAnime;

    const closeModal = () => {
      showModal.value = false;
      currentEditedAnime.value = {};
    }

    onMounted(async () => {
        await refreshList();
    });
</script>

<style scoped>
.container::-webkit-scrollbar {
  width: 8px;
}

.container::-webkit-scrollbar-thumb {
  background: rgb(var(--darker-bg-color-rgb));
  border-radius: 10px;
}

.container {
  max-height: calc(100vh - calc(var(--drag-height) + var(--action-bar-height)));
  overflow-y: auto;
}

.item {
  display: flex;
  padding: .5rem .75rem;
  gap: .5rem;
  align-items: center;
  justify-content: space-between;
  cursor: move;
}

.item:hover {
  background-color: rgba(255,255,255,.05);
}

.day {
  background: rgb(43, 45, 49);
  padding: .3rem;
  font-weight: 900;
  text-transform: uppercase;
  text-align: center;
  position: sticky;
  top: -1px;
}

.item__episodes {
  display: inline-flex;
  align-items: center;
}

.input-number {
  width: 3rem;
  vertical-align: top;
  text-align: right;
  outline: none;
}

.input-number::-webkit-outer-spin-button,
.input-number::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-number,
.input-number-decrement,
.input-number-increment {
  border-width: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  color: rgb(var(--primary-txt-color-rgb));
}

.input-number-decrement,
.input-number-increment {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 2rem;
  width: 2rem;
  text-align: center;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  border-radius: .5rem;
}

.input-number-decrement:active,
.input-number-increment:active {
  background: rgb(var(--secondary-bg-color-rgb));
}

.ghost {
    opacity: 0.5;
    border: 1px dashed #ccc;
}

.drag {
    background: #000000;
}
</style>
