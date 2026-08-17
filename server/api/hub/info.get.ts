import { defineEventHandler } from 'h3';
import { localHubStore } from '../../utils/localHubStore';

export default defineEventHandler((event) => {
  return {
    success: true,
    data: localHubStore.getHubInfo(),
  };
});
