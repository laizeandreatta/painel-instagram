import { PostStatus, STATUS_LABELS } from "@/lib/types";
import clsx from "clsx";

const STYLES: Record<PostStatus, string> = {
  ideia: "bg-baby-pink-light text-bordeaux border border-baby-pink",
  producao: "bg-baby-pink text-bordeaux border border-baby-pink",
  aprovacao: "bg-[#f7e2b8] text-[#7a5416] border border-[#eccf8f]",
  agendado: "bg-[#dbe7f0] text-[#294a63] border border-[#c3d9e8]",
  publicado: "bg-wine text-off-white border border-wine",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
