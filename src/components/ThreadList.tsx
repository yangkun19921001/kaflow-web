import React, { useState, useEffect, useRef, useCallback } from 'react';
import { message, Spin, Empty } from 'antd';
import { RefreshCw } from 'lucide-react';
import ThreadItem from './ThreadItem';
import { Thread, fetchThreads } from '../services/threadService';

interface ThreadListProps {
  username: string;
  activeThreadId: string | null;
  onThreadSelect: (thread: Thread) => void;
  configs: Array<{ id: string; name: string; description?: string }>; // 场景配置列表
}

/**
 * 时间分组类型
 */
interface ThreadGroup {
  label: string;
  threads: Thread[];
}

/**
 * 会话列表组件
 * 功能：
 * 1. 展示用户的会话列表
 * 2. 支持下拉刷新
 * 3. 支持上拉加载更多
 * 4. 分页加载
 */
const ThreadList: React.FC<ThreadListProps> = ({
  username,
  activeThreadId,
  onThreadSelect,
  configs,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  /**
   * 根据 config_id 获取场景名称
   */
  const getConfigName = (configId: string): string | undefined => {
    const config = configs.find((c) => c.id === configId);
    return config?.name;
  };

  /**
   * 将会话按时间分组
   */
  const groupThreadsByTime = useCallback((threads: Thread[]): ThreadGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups: { [key: string]: Thread[] } = {
      '今天': [],
      '昨天': [],
      '7 天内': [],
      '30 天内': [],
    };

    const monthGroups: { [key: string]: Thread[] } = {};

    threads.forEach((thread) => {
      const threadDate = new Date(thread.last_updated);
      const threadDateOnly = new Date(
        threadDate.getFullYear(),
        threadDate.getMonth(),
        threadDate.getDate()
      );

      if (threadDateOnly.getTime() === today.getTime()) {
        groups['今天'].push(thread);
      } else if (threadDateOnly.getTime() === yesterday.getTime()) {
        groups['昨天'].push(thread);
      } else if (threadDateOnly >= sevenDaysAgo) {
        groups['7 天内'].push(thread);
      } else if (threadDateOnly >= thirtyDaysAgo) {
        groups['30 天内'].push(thread);
      } else {
        // 按月份分组
        const year = threadDate.getFullYear();
        const month = threadDate.getMonth() + 1;
        const monthKey = `${year} 年 ${month} 月`;
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = [];
        }
        monthGroups[monthKey].push(thread);
      }
    });

    // 构建结果数组
    const result: ThreadGroup[] = [];

    // 添加固定时间段
    ['今天', '昨天', '7 天内', '30 天内'].forEach((label) => {
      if (groups[label].length > 0) {
        result.push({ label, threads: groups[label] });
      }
    });

    // 添加月份分组（按时间倒序）
    const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => {
      const [yearA, monthA] = a.split(' 年 ').map((v) => parseInt(v));
      const [yearB, monthB] = b.split(' 年 ').map((v) => parseInt(v));
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

    sortedMonthKeys.forEach((monthKey) => {
      result.push({ label: monthKey, threads: monthGroups[monthKey] });
    });

    return result;
  }, []);

  /**
   * 加载会话列表
   */
  const loadThreads = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetchThreads({
          username,
          page: pageNum,
          page_size: 100,
          order: 'desc',
        });

        const newThreads = response.threads || [];

        if (isRefresh || pageNum === 1) {
          setThreads(newThreads);
        } else {
          setThreads((prev) => [...prev, ...newThreads]);
        }

        setTotalPages(response.total_pages);
        setHasMore(pageNum < response.total_pages);
        setPage(pageNum);
      } catch (error) {
        console.error('加载会话列表失败:', error);
        message.error('加载会话列表失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [username]
  );

  /**
   * 初始化加载
   */
  useEffect(() => {
    loadThreads(1);
  }, [loadThreads]);

  /**
   * 下拉刷新处理
   */
  const handleRefresh = useCallback(() => {
    loadThreads(1, true);
  }, [loadThreads]);

  /**
   * 上拉加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadThreads(page + 1);
    }
  }, [loadThreads, page, hasMore, loadingMore, loading]);

  /**
   * 滚动事件处理 - 检测上拉加载
   */
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const scrollThreshold = 50;

    // 检测是否滚动到底部
    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  /**
   * 触摸开始 - 记录起始位置
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!listRef.current) return;
    
    const { scrollTop } = listRef.current;
    
    // 只有在顶部时才记录起始位置
    if (scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
      isPulling.current = false; // 初始化为 false，等待向下拉动
    }
  };

  /**
   * 触摸移动 - 检测下拉距离
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!listRef.current) return;
    
    const { scrollTop } = listRef.current;
    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - pullStartY.current;
    
    // 只有在顶部且向下拉时才处理
    if (scrollTop <= 0 && pullDistance > 0) {
      isPulling.current = true;
      
      // 下拉超过阈值触发刷新
      if (pullDistance > 80 && !refreshing && !loading) {
        isPulling.current = false;
        pullStartY.current = 0;
        handleRefresh();
      }
    } else {
      // 不在顶部或者不是向下拉，重置状态，允许正常滚动
      isPulling.current = false;
    }
  };

  /**
   * 触摸结束 - 重置状态
   */
  const handleTouchEnd = () => {
    isPulling.current = false;
    pullStartY.current = 0;
  };

  /**
   * 处理会话选中
   */
  const handleThreadClick = (thread: Thread) => {
    onThreadSelect(thread);
  };

  return (
    <div className="thread-list-container">
      {/* 刷新指示器 */}
      {refreshing && (
        <div className="thread-list-refresh-indicator">
          <RefreshCw size={16} className="animate-spin" />
          <span>刷新中...</span>
        </div>
      )}

      {/* 会话列表 */}
      <div
        ref={listRef}
        className="thread-list"
        onScroll={handleScroll}
      >
        {loading && threads.length === 0 ? (
          // 首次加载
          <div className="thread-list-loading">
            <Spin size="large" />
            <div className="thread-list-loading-text">加载中...</div>
          </div>
        ) : threads.length === 0 ? (
          // 空状态
          <div className="thread-list-empty">
            <Empty
              description="暂无会话记录"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <>
            {/* 按时间分组显示会话列表 */}
            {groupThreadsByTime(threads).map((group, groupIndex) => (
              <div key={group.label} className="thread-group">
                {/* 分组标题 */}
                <div className="thread-group-title">{group.label}</div>
                
                {/* 分组下的会话列表 */}
                <div className="thread-group-items">
                  {group.threads.map((thread) => (
                    <ThreadItem
                      key={thread.thread_id}
                      thread={thread}
                      isActive={thread.thread_id === activeThreadId}
                      onClick={() => handleThreadClick(thread)}
                      configName={getConfigName(thread.config_id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* 加载更多指示器 */}
            {loadingMore && (
              <div className="thread-list-loading-more">
                <Spin size="small" />
                <span>加载更多...</span>
              </div>
            )}

            {/* 没有更多数据提示 */}
            {!hasMore && threads.length > 0 && (
              <div className="thread-list-no-more">没有更多会话了</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ThreadList;

