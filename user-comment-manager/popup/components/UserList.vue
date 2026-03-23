<template>
  <div class="ucm-user-list">
    <!-- 搜索栏 -->
    <div class="ucm-search-bar">
      <input
        type="text"
        class="ucm-search-input"
        v-model="searchQuery"
        placeholder="搜索用户..."
        @input="handleSearch"
      >
      <button class="ucm-search-button" @click="handleSearch">搜索</button>
    </div>

    <!-- 标签云 -->
    <div class="ucm-tag-cloud">
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
    </div>

    <!-- 统计信息 -->
    <div class="ucm-stats-container">
      <div class="ucm-stats-card">
        <div class="ucm-stats-value">{{ filteredUsers.length }}</div>
        <div class="ucm-stats-label">标记用户</div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="ucm-list">
      <div
        v-for="user in filteredUsers"
        :key="user.userId"
        class="ucm-list-item"
        @click="viewUser(user)"
      >
        <div class="ucm-user-item">
          <div class="ucm-user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
          <div class="ucm-user-info">
            <div class="ucm-user-name">{{ truncateText(user.username, 20) }}</div>
            <div class="ucm-user-meta">{{ formatDate(user.markDate) }}</div>
            <div v-if="user.tags && user.tags.length > 0" class="ucm-user-tags">
              <span v-for="tag in user.tags" :key="tag" class="ucm-user-tag">{{ tag }}</span>
            </div>
          </div>
          <div class="ucm-user-actions">
            <button class="ucm-button-secondary" @click.stop="viewUser(user)">查看</button>
            <button class="ucm-button-danger" @click.stop="removeUser(user.userId)">删除</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredUsers.length === 0" class="ucm-empty-state">
        <div class="ucm-empty-state-icon">👤</div>
        <div>暂无标记的用户</div>
      </div>
    </div>
  </div>
</template>

<script>
import helpers from '../../utils/helpers.js';

export default {
  name: 'UserList',

  props: {
    users: {
      type: Object,
      default: () => ({})
    },
    tags: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      searchQuery: '',
      currentFilter: null
    };
  },

  computed: {
    filteredUsers() {
      let users = Object.values(this.users);

      // 应用搜索过滤
      if (this.searchQuery) {
        users = users.filter(user => {
          const searchText = `${user.username} ${user.markNote} ${user.tags?.join(' ') || ''}`.toLowerCase();
          return searchText.includes(this.searchQuery.toLowerCase());
        });
      }

      // 应用标签过滤
      if (this.currentFilter) {
        users = users.filter(user => {
          return user.tags && user.tags.includes(this.currentFilter);
        });
      }

      // 按标记日期降序排序
      return users.sort((a, b) => new Date(b.markDate) - new Date(a.markDate));
    }
  },

  methods: {
    handleSearch() {
      this.$emit('search', this.searchQuery);
    },

    setFilter(tag) {
      this.currentFilter = tag;
      this.$emit('filter', tag);
    },

    viewUser(user) {
      if (user.profileUrl) {
        window.open(user.profileUrl, '_blank');
      } else {
        this.$emit('show-notification', '用户没有主页链接', 'info');
      }
    },

    removeUser(userId) {
      if (confirm('确定要删除这个用户的标记吗？')) {
        this.$emit('remove-user', userId);
      }
    },

    truncateText(text, maxLength) {
      return helpers.truncateText(text, maxLength);
    },

    formatDate(date) {
      return helpers.formatDate(date);
    }
  }
};
</script>

<style scoped>
.ucm-user-list {
  width: 100%;
}

.ucm-search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.ucm-search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.ucm-search-button:hover {
  background: #3367d6;
}

.ucm-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  max-height: 60px;
  overflow-y: auto;
}

.ucm-tag-cloud-item {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
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

.ucm-stats-container {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.ucm-stats-card {
  flex: 1;
  background: white;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ucm-stats-value {
  font-size: 20px;
  font-weight: 600;
  color: #4285F4;
}

.ucm-stats-label {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.ucm-list {
  list-style: none;
}

.ucm-list-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s ease;
  background: white;
  margin-bottom: 4px;
  border-radius: 4px;
}

.ucm-list-item:hover {
  background: #f8f9fa;
}

.ucm-list-item:last-child {
  border-bottom: none;
}

.ucm-user-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ucm-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8f0fe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #1a73e8;
  font-weight: 600;
  flex-shrink: 0;
}

.ucm-user-info {
  flex: 1;
  min-width: 0;
}

.ucm-user-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ucm-user-meta {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ucm-user-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.ucm-user-tag {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.ucm-user-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.ucm-user-actions button {
  padding: 4px 8px;
  font-size: 11px;
}

.ucm-empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #666;
}

.ucm-empty-state-icon {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.ucm-button-secondary {
  background: #f1f3f4;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.ucm-button-secondary:hover {
  background: #e8eaed;
}

.ucm-button-danger {
  background: #EA4335;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.ucm-button-danger:hover {
  background: #d33426;
}
</style>