import Image from "next/image";

type LogoProps = {
    imageUrl: string;
    height?: number;
    width?: number;
    alt?: string;

}

const logo = ({imageUrl, height, width, alt}: LogoProps) => {
  return (
    <div className="inline-flex items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_45%,rgba(226,232,240,1)_100%)] p-2 shadow-sm ring-1 ring-slate-200/60">
        <Image
            src={imageUrl}
            height={height ?? 20}
            width={width ?? 20}
            alt={alt ?? "Company Logo"}
            className="object-contain"
        />
    </div>
  )
}

export default logo