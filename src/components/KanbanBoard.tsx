"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { Post, PostStatus, STATUS_LABELS, STATUS_ORDER } from "@/lib/types";
import { PostCard } from "./PostCard";

function DraggableCard({ post }: { post: Post }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: post.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <PostCard post={post} />
    </div>
  );
}

function Column({
  status,
  posts,
}: {
  status: PostStatus;
  posts: Post[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
        isOver ? "border-wine bg-baby-pink-light" : "border-line bg-off-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-ink">
          {STATUS_LABELS[status]}
        </h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-ink/50 border border-line">
          {posts.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 kanban-scroll overflow-y-auto pb-2">
        {posts.map((post) => (
          <DraggableCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-ink/35">
            Nenhum post
          </p>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  posts,
  onStatusChange,
}: {
  posts: Post[];
  onStatusChange: (postId: string, status: PostStatus) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const novoStatus = over.id as PostStatus;
    if (STATUS_ORDER.includes(novoStatus)) {
      onStatusChange(String(active.id), novoStatus);
    }
  }

  const activePost = posts.find((p) => p.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            posts={posts.filter((p) => p.status === status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activePost ? (
          <div className="w-72 rotate-2 opacity-95">
            <PostCard post={activePost} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
