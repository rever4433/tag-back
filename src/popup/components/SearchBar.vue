<template>
  <div class="ucm-search-bar-component">
    <div class="ucm-search-input-container">
      <input
        type="text"
        class="ucm-search-input"
        v-model="searchQuery"
        :placeholder="placeholder"
        @input="handleInput"
        @keyup.enter="handleSearch"
      >
      <button
        class="ucm-search-button"
        @click="handleSearch"
        :disabled="!searchQuery"
      >
        搜索
      </button>
    </div>
    <div v-if="searchQuery" class="ucm-search-info">
      <span>搜索 "{{ searchQuery }}"</span>
      <button class="ucm-search-clear" @click="clearSearch">清除</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',

  props: {
    placeholder: {
      type: String,
      default: '搜索用户或评论...'
    },
    value: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      searchQuery: this.value
    };
  },

  watch: {
    value(newVal) {
      this.searchQuery = newVal;
    }
  },

  methods: {
    handleInput() {
      this.$emit('input', this.searchQuery);
    },

    handleSearch() {
      this.$emit('search', this.searchQuery);
    },

    clearSearch() {
      this.searchQuery = '';
      this.$emit('input', '');
      this.$emit('search', '');
    }
  }
};
</script>

<style scoped>
.ucm-search-bar-component {
  margin-bottom: 12px;
}

.ucm-search-input-container {
  display: flex;
  gap: 8px;
}

.ucm-search-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.ucm-search-input:focus {
  outline: none;
  border-color: #4285F4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.ucm-search-button {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.ucm-search-button:hover:not(:disabled) {
  background: #3367d6;
}

.ucm-search-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.ucm-search-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: #666;
}

.ucm-search-clear {
  background: none;
  border: none;
  color: #4285F4;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
}

.ucm-search-clear:hover {
  text-decoration: underline;
}
</style>