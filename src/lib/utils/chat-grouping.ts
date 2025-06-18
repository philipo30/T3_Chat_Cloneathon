import { Chat } from '@/lib/supabase/database.types';
import { 
  isToday, 
  isYesterday, 
  isThisWeek, 
  isThisMonth, 
  startOfDay, 
  subDays,
  subWeeks,
  subMonths 
} from 'date-fns';

export type ChatGroup = {
  id: string;
  label: string;
  chats: Chat[];
  priority: number; // Lower number = higher priority (appears first)
};

export type GroupedChats = {
  pinned: ChatGroup;
  today: ChatGroup;
  yesterday: ChatGroup;
  thisWeek: ChatGroup;
  thisMonth: ChatGroup;
  older: ChatGroup;
};

/**
 * Groups chats by time periods with pinned chats at the top
 */
export function groupChatsByTime(chats: Chat[]): GroupedChats {
  const now = new Date();
  const startOfToday = startOfDay(now);
  const sevenDaysAgo = subDays(startOfToday, 7);
  const thirtyDaysAgo = subDays(startOfToday, 30);

  const groups: GroupedChats = {
    pinned: {
      id: 'pinned',
      label: 'Pinned',
      chats: [],
      priority: 0,
    },
    today: {
      id: 'today',
      label: 'Today',
      chats: [],
      priority: 1,
    },
    yesterday: {
      id: 'yesterday',
      label: 'Yesterday',
      chats: [],
      priority: 2,
    },
    thisWeek: {
      id: 'thisWeek',
      label: 'Last 7 days',
      chats: [],
      priority: 3,
    },
    thisMonth: {
      id: 'thisMonth',
      label: 'Last 30 days',
      chats: [],
      priority: 4,
    },
    older: {
      id: 'older',
      label: 'Older',
      chats: [],
      priority: 5,
    },
  };

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updated_at);

    // Pinned chats go to pinned group regardless of date
    if (chat.pinned) {
      groups.pinned.chats.push(chat);
      return;
    }

    // Group by time periods
    if (isToday(chatDate)) {
      groups.today.chats.push(chat);
    } else if (isYesterday(chatDate)) {
      groups.yesterday.chats.push(chat);
    } else if (chatDate >= sevenDaysAgo) {
      groups.thisWeek.chats.push(chat);
    } else if (chatDate >= thirtyDaysAgo) {
      groups.thisMonth.chats.push(chat);
    } else {
      groups.older.chats.push(chat);
    }
  });

  return groups;
}

/**
 * Gets non-empty groups in display order
 */
export function getNonEmptyGroups(groupedChats: GroupedChats): ChatGroup[] {
  return Object.values(groupedChats)
    .filter(group => group.chats.length > 0)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Gets the total count of chats across all groups
 */
export function getTotalChatCount(groupedChats: GroupedChats): number {
  return Object.values(groupedChats).reduce((total, group) => total + group.chats.length, 0);
}

/**
 * Finds a chat by ID across all groups
 */
export function findChatInGroups(groupedChats: GroupedChats, chatId: string): { chat: Chat; groupId: string } | null {
  for (const [groupId, group] of Object.entries(groupedChats)) {
    const chat = group.chats.find(c => c.id === chatId);
    if (chat) {
      return { chat, groupId };
    }
  }
  return null;
}

/**
 * Moves a chat between groups (useful for optimistic updates)
 */
export function moveChatBetweenGroups(
  groupedChats: GroupedChats,
  chatId: string,
  fromGroupId: string,
  toGroupId: string
): GroupedChats {
  const newGroups = { ...groupedChats };
  
  // Find and remove chat from source group
  const fromGroup = newGroups[fromGroupId as keyof GroupedChats];
  const chatIndex = fromGroup.chats.findIndex(c => c.id === chatId);
  
  if (chatIndex === -1) return groupedChats; // Chat not found
  
  const [chat] = fromGroup.chats.splice(chatIndex, 1);
  
  // Add chat to destination group
  const toGroup = newGroups[toGroupId as keyof GroupedChats];
  toGroup.chats.unshift(chat); // Add to beginning
  
  return newGroups;
}

/**
 * Updates a chat in the groups (useful for optimistic updates)
 */
export function updateChatInGroups(
  groupedChats: GroupedChats,
  chatId: string,
  updates: Partial<Chat>
): GroupedChats {
  const newGroups = { ...groupedChats };
  
  for (const group of Object.values(newGroups)) {
    const chatIndex = group.chats.findIndex(c => c.id === chatId);
    if (chatIndex !== -1) {
      group.chats[chatIndex] = { ...group.chats[chatIndex], ...updates };
      break;
    }
  }
  
  return newGroups;
}

/**
 * Sorts chats within each group
 */
export function sortChatsInGroups(groupedChats: GroupedChats): GroupedChats {
  const newGroups = { ...groupedChats };
  
  // Sort pinned chats by pinned_at (most recently pinned first)
  newGroups.pinned.chats.sort((a, b) => {
    if (!a.pinned_at || !b.pinned_at) return 0;
    return new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime();
  });
  
  // Sort other groups by updated_at (most recent first)
  const groupsToSort = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'older'] as const;
  groupsToSort.forEach(groupKey => {
    newGroups[groupKey].chats.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });
  
  return newGroups;
}

/**
 * Gets a relative time label for a chat
 */
export function getChatTimeLabel(chat: Chat): string {
  const chatDate = new Date(chat.updated_at);
  
  if (isToday(chatDate)) {
    return 'Today';
  } else if (isYesterday(chatDate)) {
    return 'Yesterday';
  } else if (isThisWeek(chatDate)) {
    return 'This week';
  } else if (isThisMonth(chatDate)) {
    return 'This month';
  } else {
    return 'Older';
  }
}
