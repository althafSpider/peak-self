import { Inject, Injectable } from '@nestjs/common';

import { DomainEvent, Prisma } from '@repo/db';

import { PrismaService } from 'src/prisma/prisma.service';

import { PublishDomainEventInput } from '../types/domain-events.types';

@Injectable()
export class DomainEventsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async publish(
    data: PublishDomainEventInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainEvent> {
    const client = tx ?? this.prisma;

    return client.domainEvent.create({
      data: {
        userId: data.userId,

        eventType: data.eventType,

        entityType: data.entityType,

        entityId: data.entityId,

        payload: data.payload,
      },
    });
  }
}