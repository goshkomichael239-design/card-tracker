export type CardType = 'task' | 'routine' | 'list';
export type CardStatus = 'active' | 'completed' | 'deleted';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskCard {
  id: string;
  type: CardType;
  status: CardStatus;

  title: string;
  checklist: ChecklistItem[];

  colorId: string;
  isFavorite: boolean;

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletedAt?: string;
}

export interface CreateCardInput {
  type: CardType;
  title: string;
  checklist: string[];
  colorId: string;
}