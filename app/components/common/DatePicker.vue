<template>
  <div ref="rootRef" class="date-picker position-relative">
    <input
      type="text"
      readonly
      class="form-control py-2 rounded-3 date-input"
      :value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @click="toggle"
      @focus="open"
      @keydown.escape="close"
      role="combobox"
      aria-haspopup="dialog"
      :aria-expanded="openState ? 'true' : 'false'"
    />
    <i class="bi bi-calendar3 date-icon position-absolute end-0 top-50 translate-middle-y pe-3 text-muted"></i>

    <Transition name="datepicker-pop">
      <div
        v-if="openState"
        class="calendar-popover"
        :style="popoverStyle"
        role="dialog"
        aria-label="Pick a date"
      >
        <!-- Month Navigation Header -->
        <div class="calendar-header d-flex align-items-center justify-content-between">
          <button type="button" class="cal-nav-btn" @click="prevMonth" aria-label="Previous month">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="cal-title">{{ monthLabel }}</span>
          <button type="button" class="cal-nav-btn" @click="nextMonth" aria-label="Next month">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <!-- Weekday Labels -->
        <div class="cal-weekdays">
          <span v-for="d in weekdays" :key="d" class="cal-weekday">{{ d }}</span>
        </div>

        <!-- Day Grid -->
        <div class="cal-days">
          <button
            v-for="(day, index) in days"
            :key="index"
            type="button"
            class="cal-day"
            :class="{
              'cal-day--muted': !isCurrentMonth(day),
              'cal-day--today': isToday(day),
              'cal-day--selected': isSelected(day),
            }"
            :aria-label="formatAriaDate(day)"
            @click="selectDay(day)"
          >
            {{ day.getDate() }}
          </button>
        </div>

        <!-- Footer -->
        <div class="calendar-footer d-flex align-items-center">
          <button type="button" class="cal-today-btn" @click="selectToday">Today</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'Select a date',
    disabled: false,
  }
);

const emit = defineEmits(['update:modelValue']);

const rootRef = ref<HTMLElement | null>(null);
const openState = ref(false);
const viewDate = ref<Date>(new Date());
const popoverTop = ref('0px');
const popoverLeft = ref('0px');
const popoverWidth = ref('280px');

const popoverStyle = computed(() => ({
  top: popoverTop.value,
  left: popoverLeft.value,
  width: popoverWidth.value,
}));

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const selectedDate = computed(() => parseDate(props.modelValue));

const displayValue = computed(() => (props.modelValue ? formatDate(props.modelValue) : ''));

const monthLabel = computed(() => `${monthNames[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`);

const days = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month, 1 - firstWeekday + i));
  }
  return cells;
});

function isCurrentMonth(day: Date) {
  return day.getMonth() === viewDate.value.getMonth();
}

function isToday(day: Date) {
  const t = new Date();
  return day.getFullYear() === t.getFullYear() && day.getMonth() === t.getMonth() && day.getDate() === t.getDate();
}

function isSelected(day: Date) {
  const s = selectedDate.value;
  if (!s) return false;
  return day.getFullYear() === s.getFullYear() && day.getMonth() === s.getMonth() && day.getDate() === s.getDate();
}

function formatAriaDate(day: Date) {
  return day.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function open() {
  if (props.disabled) return;
  const d = selectedDate.value || new Date();
  viewDate.value = new Date(d.getFullYear(), d.getMonth(), 1);
  openState.value = true;
  await nextTick();
  positionPopover();
}

function close() {
  openState.value = false;
}

function toggle() {
  openState.value ? close() : open();
}

function positionPopover() {
  const input = rootRef.value?.querySelector('input');
  if (!input) return;
  const rect = input.getBoundingClientRect();
  const gap = 6;
  const width = Math.max(280, rect.width);
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const popoverHeight = 340;
  const top = spaceAbove >= popoverHeight + gap ? rect.top - popoverHeight - gap : rect.bottom + gap;
  popoverTop.value = `${Math.max(8, top)}px`;
  popoverLeft.value = `${left}px`;
  popoverWidth.value = `${width}px`;
}

function selectDay(day: Date) {
  emit('update:modelValue', toInput(day));
  close();
}

function selectToday() {
  emit('update:modelValue', toInput(new Date()));
  close();
}

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1);
}

function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1);
}

function handleOutsideClick(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    close();
  }
}

function handleViewportChange() {
  if (openState.value) positionPopover();
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  window.addEventListener('scroll', handleViewportChange, true);
  window.addEventListener('resize', handleViewportChange);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  window.removeEventListener('scroll', handleViewportChange, true);
  window.removeEventListener('resize', handleViewportChange);
});
</script>

<style scoped>
.date-picker {
  width: 100%;
}

.date-input {
  padding-right: 2.5rem;
  cursor: pointer;
  background-color: #fff;
}

.date-icon {
  pointer-events: none;
}

.calendar-popover {
  position: fixed;
  z-index: 60;
  width: 280px;
  max-width: 90vw;
  background: #fff;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
  padding: 0.75rem;
}

.calendar-header {
  margin-bottom: 0.5rem;
}

.cal-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--slate-900);
}

.cal-nav-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--slate-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.cal-nav-btn:hover {
  background: var(--green-50);
  color: var(--green-600);
  border-color: var(--green-200);
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 2px;
}

.cal-weekday {
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--slate-300);
  padding: 0.25rem 0;
}

.cal-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  aspect-ratio: 1;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--slate-700);
  cursor: pointer;
  transition: all 0.12s;
}

.cal-day:hover {
  background: var(--green-50);
  color: var(--green-600);
}

.cal-day--muted {
  color: var(--slate-300);
}

.cal-day--today {
  box-shadow: inset 0 0 0 1.5px var(--green-500);
  color: var(--green-700);
  font-weight: 700;
}

.cal-day--selected {
  background: var(--green-500);
  color: #fff;
  font-weight: 700;
}

.cal-day--selected:hover {
  background: var(--green-600);
  color: #fff;
}

.calendar-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.cal-today-btn {
  border: none;
  background: var(--green-50);
  color: var(--green-700);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}

.cal-today-btn:hover {
  background: var(--green-100);
}

.datepicker-pop-enter-active,
.datepicker-pop-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.datepicker-pop-enter-from,
.datepicker-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
