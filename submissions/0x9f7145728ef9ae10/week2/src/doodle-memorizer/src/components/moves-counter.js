import Image from "next/image";
import move from "../../public/moves.gif";

export default function MovesCounter({ moves }) {
  return (
    <div className="flex items-center gap-3 px-4 h-16 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] rounded-xl">
      <Image src={move} alt="Moves Icon" width={45} height={45} />
      <span className="text-lg font-bold text-black ml-[-18]">Moves: {moves}</span>
    </div>
  );
}