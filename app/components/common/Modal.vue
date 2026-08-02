<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleBackdropClick">
      <div
        class="modal-box p-0 overflow-hidden position-relative"
        :class="[maxWidthClass]"
      >
        <!-- Modal Header with Gradient -->
        <div
          class="modal-header-row text-white p-3 px-4 mb-0 d-flex align-items-center justify-content-center"
          :class="[variantClass]"
        >
          <h5 class="modal-title text-white fw-bold d-flex align-items-center justify-content-center gap-2 mb-0 fs-6">
            <i v-if="icon" :class="['bi', icon]"></i>
            <span>{{ title }}</span>
          </h5>
          <button
            class="modal-close text-white opacity-75 hover-opacity-100 position-absolute end-0 me-3"
            @click="close"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Modal Body Content -->
        <div class="modal-body-content p-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    icon?: string;
    variant?: 'primary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    variant: 'primary',
    size: 'md',
  }
);

const emit = defineEmits(['update:modelValue', 'close']);

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function handleBackdropClick() {
  close();
}

const variantClass = computed(() => {
  return props.variant === 'danger' ? 'modal-header-danger' : 'modal-header-gradient';
});

const maxWidthClass = computed(() => {
  if (props.size === 'sm') return 'modal-box--sm';
  if (props.size === 'lg') return 'modal-box--lg';
  return 'modal-box--md';
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 28, 36, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
  padding: 1rem;
}

.modal-box {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modalIn 0.2s ease;
}

.modal-body-content {
  overflow-y: auto;
  flex: 1;
}

.modal-box--sm { max-width: 380px; }
.modal-box--md { max-width: 460px; }
.modal-box--lg { max-width: 640px; }

@keyframes modalIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header-gradient {
  background: linear-gradient(135deg, var(--green-600) 0%, var(--green-500) 50%, var(--green-700) 100%);
}

.modal-header-danger {
  background: linear-gradient(135deg, var(--red-700) 0%, var(--red-500) 100%);
}

.modal-header-row {
  min-height: 52px;
}

.modal-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.18s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
