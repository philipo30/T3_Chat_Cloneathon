import { useMemo } from 'react';
import { Chat } from '@/lib/supabase/database.types';
import { groupChatsByTime, getNonEmptyGroups, sortChatsInGroups, type GroupedChats } from '@/lib/utils/chat-grouping';

interface UseGroupedChatsOptions {
  searchQuery?: string;
}

export function useGroupedChats(chats: Chat[], options: UseGroupedChatsOptions = {}) {
  const { searchQuery = '' } = options;

  return useMemo(() => {
    // Filter chats based on search query
    const filteredChats = chats.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group chats by time periods
    const groupedChats = groupChatsByTime(filteredChats);
    
    // Sort chats within each group
    const sortedGroupedChats = sortChatsInGroups(groupedChats);
    
    // Get non-empty groups in display order
    const nonEmptyGroups = getNonEmptyGroups(sortedGroupedChats);

    return {
      filteredChats,
      groupedChats: sortedGroupedChats,
      nonEmptyGroups,
      totalCount: filteredChats.length,
      pinnedCount: sortedGroupedChats.pinned.chats.length,
    };
  }, [chats, searchQuery]);
}

export type UseGroupedChatsResult = ReturnType<typeof useGroupedChats>;
