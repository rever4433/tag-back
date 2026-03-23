<template>
  <div class="ucm-comment-list">
    <!-- 搜索栏 -->
    <div class="ucm-search-bar">
      <input
        type="text"
        class="ucm-search-input"
        v-model="searchQuery"
        placeholder="搜索评论..."
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
        <div class="ucm-stats-value">{{ filteredComments.length }}</div>
        <div class="ucm-stats-label">收藏评论</div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="ucm-list">
      <div
        v-for="comment in filteredComments"
        :key="comment.commentId"
        class="ucm-list-item"
        @click="viewComment(comment)"
      >
        <div class="ucm-comment-item">
          <div class="ucm-comment-content">{{ truncateText(comment.content, 150) }}</div>
          <div class="ucm-comment-meta">
            <span>{{ formatDate(comment.commentDate) }}</span>
            <div v-if="comment.tags && comment.tags.length > 0" class="ucm-comment-tags">
              <span v-for="tag in comment.tags" :key="tag" class="ucm-comment-tag">{{ tag }}</span>
            </div>
          </div>
          <div v-if="comment.note" class="ucm-comment-note">
            备注: {{ truncateText(comment.note, 50) }}
          </div>
          <div class="ucm-comment-actions">
            <button class="ucm-button-secondary" @click.stop="viewComment(comment)">查看</button>
            <button class="ucm-button-danger" @click.stop="removeComment(comment.commentId)">删除</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredComments.length === 0" class="ucm-empty-state">
        <div class="ucm-empty-state-icon">💬</div>
        <div>暂无收藏的评论</div>
      </div>
    </div>
  </div>
</template>

<script>
import helpers from '../../utils/helpers.js';

export default {
  name: 'CommentList',

  props: {
    comments: {
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
    filteredComments() {
      let comments = Object.values(this.comments);

      // 应用搜索过滤
      if (this.searchQuery) {
        comments = comments.filter(comment => {
          const searchText = `${comment.content} ${comment.note} ${comment.tags?.join(' ') || ''}`.toLowerCase();
          return searchText.includes(this.searchQuery.toLowerCase());
        });
      }

      // 应用标签过滤
      if (this.currentFilter) {
        comments = comments.filter(comment => {
          return comment.tags && comment.tags.includes(this.currentFilter);
        });
      }

      // 按收藏日期降序排序
      return comments.sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate));
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

    viewComment(comment) {
      if (comment.commentUrl) {
        window.open(comment.commentUrl, '_blank');
      } else {
        this.$emit('show-notification', '评论没有链接', 'info');
      }
    },

    removeComment(commentId) {
      if (confirm('确定要删除这个收藏的评论吗？')) {
        this.$emit('remove-comment', commentId);
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
.ucm-comment-list {
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

.ucm-comment-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 8px;
  background: white;
}

.ucm-comment-content {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ucm-comment-meta {
  font-size: 11px;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ucm-comment-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ucm-comment-tag {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.ucm-comment-note {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  font-style: italic;
}

.ucm-comment-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.ucm-comment-actions button {
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