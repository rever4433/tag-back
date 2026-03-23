<template>
  <div class="ucm-tag-cloud-component">
    <div class="ucm-tag-cloud-header">
      <span class="ucm-tag-cloud-title">标签云</span>
      <span class="ucm-tag-cloud-count">共 {{ tags.length }} 个标签</span>
    </div>
    <div class="ucm-tag-cloud-container">
      <div
        class="ucm-tag-cloud-item"
        :class="{ active: currentFilter === null }"
        @click="setFilter(null)"
      >
        全部
      </div>
      <div
        v-for="tag in tags"
        :key="tag"
        class="ucm-tag-cloud-item"
        :class="{ active: currentFilter === tag }"
        @click="setFilter(tag)"
      >
        {{ tag }}
      </div>
      <div v-if="tags.length === 0" class="ucm-tag-cloud-empty">
        暂无标签
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TagCloud',

  props: {
    tags: {
      type: Array,
      default: () => []
    },
    currentFilter: {
      type: String,
      default: null
    }
  },

  methods: {
    setFilter(tag) {
      this.$emit('filter', tag);
    }
  }
};
</script>

<style scoped>
.ucm-tag-cloud-component {
  margin-bottom: 12px;
}

.ucm-tag-cloud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ucm-tag-cloud-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.ucm-tag-cloud-count {
  font-size: 12px;
  color: #666;
}

.ucm-tag-cloud-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 80px;
  overflow-y: auto;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 6px;
}

.ucm-tag-cloud-item {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ucm-tag-cloud-item:hover {
  background: #d2e3fc;
  transform: scale(1.05);
}

.ucm-tag-cloud-item.active {
  background: #4285F4;
  color: white;
}

.ucm-tag-cloud-empty {
  font-size: 12px;
  color: #999;
  padding: 4px 8px;
}
</style>