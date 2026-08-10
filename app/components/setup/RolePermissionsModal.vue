<template>
  <CommonModal
    v-model="isOpen"
    :title="`Manage Permissions: ${role?.name || 'Role'}`"
    icon="bi-shield-lock-fill"
    size="lg"
  >
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3 text-muted mb-0">Loading permission data...</p>
    </div>

    <div v-else class="permissions-layout">
      <!-- Left Column: Feature Groups -->
      <div class="groups-column">
        <div
          v-for="group in featureGroups"
          :key="group.id"
          class="group-item"
          :class="{ 'group-item--active': selectedGroupId === group.id }"
          @click="selectedGroupId = group.id"
        >
          <span class="group-name">{{ group.name }}</span>
          <span
            class="badge rounded-pill fs-8"
            :class="assignedCountInGroup(group.id) > 0 ? 'bg-green-subtle text-green-700' : 'bg-secondary-subtle text-secondary'"
          >
            {{ assignedCountInGroup(group.id) }}/{{ totalCountInGroup(group.id) }}
          </span>
        </div>
        <div v-if="featureGroups.length === 0" class="text-muted fs-7 text-center py-4">
          No feature groups defined.
        </div>
      </div>

      <!-- Right Column: Features & Actions -->
      <div class="features-column">
        <div v-if="!selectedGroup" class="text-muted fs-7 text-center py-5">
          Select a feature group to manage its permissions.
        </div>

        <template v-else>
          <h6 class="fw-bold text-slate-900 mb-3">{{ selectedGroup.name }}</h6>

          <div v-if="featuresInSelectedGroup.length === 0" class="text-muted fs-7 py-3">
            This feature group has no features yet.
          </div>

          <div v-for="feature in featuresInSelectedGroup" :key="feature.id" class="feature-block">
            <div class="feature-block-title">
              <i class="bi bi-box-seam"></i>
              <span>{{ feature.name }}</span>
            </div>

            <div v-if="actionsForFeature(feature.id).length === 0" class="text-muted fs-8 ps-4 pb-2">
              No actions defined for this feature.
            </div>

            <div v-else class="feature-actions-grid">
              <div
                v-for="action in actionsForFeature(feature.id)"
                :key="action.id"
                class="form-check"
              >
                <input
                  :id="`perm-action-${action.id}`"
                  v-model="checkedActionIds"
                  type="checkbox"
                  class="form-check-input cursor-pointer"
                  :value="action.id"
                />
                <label :for="`perm-action-${action.id}`" class="form-check-label fs-7 cursor-pointer">
                  {{ action.name }}
                </label>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="modal-footer-row mt-4">
      <button type="button" class="btn-cancel" @click="isOpen = false">Cancel</button>
      <button type="button" class="btn-submit" :disabled="saving || loading" @click="handleSave">
        <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
        Save Permissions
      </button>
    </div>
  </CommonModal>
</template>

<script setup lang="ts">
import type { Role } from '~/types/auth';
import type { FeatureGroup } from '~/types/feature-group';
import type { Feature } from '~/types/feature';
import type { Action } from '~/types/action';
import type { RoleAction } from '~/types/role-action';

const props = defineProps<{
  modelValue: boolean;
  role: Role | null;
  featureGroups: FeatureGroup[];
  features: Feature[];
  actions: Action[];
  roleActions: RoleAction[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const push = usePush();
const { executeOrQueue } = useOfflineSync();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const loading = ref(false);
const saving = ref(false);
const selectedGroupId = ref<number | null>(null);
const checkedActionIds = ref<number[]>([]);
const originalRoleActions = ref<RoleAction[]>([]);

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.role) {
      originalRoleActions.value = props.roleActions.filter((ra) => ra.role_id === props.role!.id);
      checkedActionIds.value = originalRoleActions.value.map((ra) => ra.action_id);
      selectedGroupId.value = props.featureGroups[0]?.id ?? null;
    }
  }
);

const selectedGroup = computed(() => props.featureGroups.find((g) => g.id === selectedGroupId.value) || null);

function featuresInGroup(groupId: number): Feature[] {
  return props.features.filter((f) => f.feature_group_id === groupId);
}

const featuresInSelectedGroup = computed(() => {
  return selectedGroupId.value ? featuresInGroup(selectedGroupId.value) : [];
});

function actionsForFeature(featureId: number): Action[] {
  return props.actions.filter((a) => a.feature_id === featureId);
}

function actionsInGroup(groupId: number): Action[] {
  const featureIds = featuresInGroup(groupId).map((f) => f.id);
  return props.actions.filter((a) => featureIds.includes(a.feature_id));
}

function totalCountInGroup(groupId: number): number {
  return actionsInGroup(groupId).length;
}

function assignedCountInGroup(groupId: number): number {
  return actionsInGroup(groupId).filter((a) => checkedActionIds.value.includes(a.id)).length;
}

async function handleSave() {
  if (!props.role) return;
  saving.value = true;

  try {
    const originalActionIds = originalRoleActions.value.map((ra) => ra.action_id);
    const toAdd = checkedActionIds.value.filter((id) => !originalActionIds.includes(id));
    const toRemove = originalRoleActions.value.filter((ra) => !checkedActionIds.value.includes(ra.action_id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      isOpen.value = false;
      push.info({ title: 'No Changes', message: 'Permissions were not modified.' });
      return;
    }

    const roleId = props.role.id;
    const promises = [
      ...toAdd.map((actionId) =>
        executeOrQueue({
          url: '/api/role-actions',
          method: 'POST',
          body: { role_id: roleId, action_id: actionId },
          label: `Grant Action #${actionId} to Role #${roleId}`,
        })
      ),
      ...toRemove.map((ra) =>
        executeOrQueue({
          url: `/api/role-actions/${ra.id}`,
          method: 'DELETE',
          label: `Revoke Action #${ra.action_id} from Role #${roleId}`,
        })
      ),
    ];

    await Promise.all(promises);

    push.success({
      title: 'Permissions Saved',
      message: `Updated permissions for "${props.role.name}" (${toAdd.length} granted, ${toRemove.length} revoked).`,
    });
    isOpen.value = false;
    emit('saved');
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to save permissions.' });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.permissions-layout {
  display: flex;
  gap: 1rem;
  min-height: 360px;
  max-height: 55vh;
}

.groups-column {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  padding-right: 0.75rem;
  overflow-y: auto;
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.7rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--slate-700);
  margin-bottom: 0.2rem;
  transition: background 0.15s;
}

.group-item:hover {
  background: var(--green-50);
}

.group-item--active {
  background: var(--green-500) !important;
  color: #fff;
}

.group-item--active .badge {
  background: rgba(255, 255, 255, 0.25) !important;
  color: #fff !important;
}

.group-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.features-column {
  flex: 1;
  overflow-y: auto;
  padding-left: 0.25rem;
}

.feature-block {
  margin-bottom: 1.1rem;
}

.feature-block-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--slate-900);
  margin-bottom: 0.5rem;
}

.feature-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem 0.75rem;
  padding-left: 1.5rem;
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }

.modal-footer-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  background: var(--slate-50);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  padding: 0.5rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--slate-700);
  cursor: pointer;
  transition: background 0.18s;
}

.btn-cancel:hover {
  background: var(--slate-100);
}

.btn-submit {
  background: var(--green-500);
  border: none;
  border-radius: 9px;
  padding: 0.5rem 1.3rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s;
  display: inline-flex;
  align-items: center;
}

.btn-submit:hover:not(:disabled) {
  background: var(--green-600);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
