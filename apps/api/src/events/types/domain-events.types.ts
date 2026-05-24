export interface PublishDomainEventInput {
  userId?: string;

  eventType: string;

  entityType: string;

  entityId?: string;

  payload: Record<string, any>;
}