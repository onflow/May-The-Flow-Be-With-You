import Image from "next/image";
import restart from "../../public/restart.png";

export default function RestartButton({onClick}){
    return (
    <div className="pt-6 pb-4">
      <button
        onClick={onClick}
        className="flex items-center justify-between pl-6 pr-3 py-3 w-44 bg-[#FDE77F] text-black text-xl font-bold border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200"
      >
        Restart
        <span className="ml-4 w-10 h-10 bg-white rounded-full flex items-center justify-center border-[2px] border-black">
          <Image
            src={restart}
            alt="Restart Icon"
            width={20}
            height={20}
            className="text-black"
          />
        </span>
      </button>
    </div>
  );
}