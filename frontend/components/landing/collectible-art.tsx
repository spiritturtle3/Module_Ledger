export type CollectibleArtProps = {
  variant?: "hero" | "sunset" | "orbit" | "totem";
};

export function CollectibleArt({ variant = "hero" }: CollectibleArtProps) {
  return (
    <div className={`relative h-full min-h-56 overflow-hidden rounded-[inherit] ${
      variant === "sunset"
        ? "bg-[#d98761]"
        : variant === "orbit"
          ? "bg-[#27312e]"
          : variant === "totem"
            ? "bg-[#c6a889]"
            : "bg-[#b9c9c0]"
    }`}>
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.55),transparent_24%),radial-gradient(circle_at_80%_80%,rgba(29,34,32,.25),transparent_34%)]" />
      {variant === "hero" && (
        <>
          <div className="absolute left-[18%] top-[15%] h-28 w-28 rounded-full bg-[#f7ede0] shadow-[20px_16px_0_#91aa9e] sm:h-40 sm:w-40" />
          <div className="absolute bottom-[13%] right-[17%] h-36 w-24 rotate-[26deg] rounded-[50%] bg-[#2f4d45] shadow-[-18px_11px_0_#f4c9a8] sm:h-48 sm:w-32" />
          <div className="absolute left-[43%] top-[40%] size-16 rounded-full border border-[#f7ede0]/80 sm:size-24" />
          <div className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[0.3em] text-white/80">M-001 / Genesis</div>
        </>
      )}
      {variant === "sunset" && (
        <>
          <div className="absolute inset-x-[12%] bottom-[20%] h-px bg-[#fff1d2]/80" />
          <div className="absolute bottom-[20%] left-[12%] size-36 translate-y-1/2 rounded-full bg-[#f7d8a8] shadow-[0_0_55px_20px_rgba(255,226,169,.25)]" />
          <div className="absolute bottom-[-18%] right-[12%] h-44 w-24 rotate-45 rounded-t-full bg-[#714a49]" />
          <div className="absolute left-5 top-5 size-2 rounded-full bg-[#fff1d2]" />
        </>
      )}
      {variant === "orbit" && (
        <>
          <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e6b28f] shadow-[0_0_45px_5px_rgba(230,178,143,.2)]" />
          <div className="absolute left-1/2 top-1/2 h-16 w-52 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] rounded-[50%] border border-[#d6eadf]/70" />
          <div className="absolute left-1/2 top-1/2 h-24 w-52 -translate-x-1/2 -translate-y-1/2 rotate-[38deg] rounded-[50%] border border-[#d6eadf]/50" />
          <div className="absolute right-8 top-8 size-1.5 rounded-full bg-[#d6eadf]" />
        </>
      )}
      {variant === "totem" && (
        <>
          <div className="absolute bottom-0 left-1/2 h-[78%] w-20 -translate-x-1/2 rounded-t-[45%] bg-[#5c4c48] shadow-[inset_15px_0_0_rgba(255,255,255,.12)]" />
          <div className="absolute left-1/2 top-[24%] size-14 -translate-x-1/2 rounded-full border-4 border-[#f4d2b5] bg-[#be7963]" />
          <div className="absolute bottom-[15%] left-1/2 h-2 w-32 -translate-x-1/2 rounded-full bg-[#4e3e3a]" />
        </>
      )}
    </div>
  );
}
