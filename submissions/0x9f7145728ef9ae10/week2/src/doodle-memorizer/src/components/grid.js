import Image from "next/image";
import back from "../../public/back.png";

export default function Grid({ cards, onCardClick, gridSize }) {
  return (
    <div
      className={`grid gap-1 sm:gap-2 w-[600px] h-[600px]`}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="relative w-full h-full perspective"
          onClick={() => onCardClick(index)}
        >
          <div
            className={`transition-transform duration-500 transform-style-preserve-3d w-full h-full ${
              card.flipped || card.matched ? "rotate-y-180" : ""
            }`}
          >
            {/* Back (hidden) */}
            <div
              className="absolute w-full h-full backface-hidden bg-gray-300 rounded-lg flex items-center justify-center"
            >
              <Image
                src={back}
                alt="Back Logo"
                width={50}  // Adjust the size as needed
                height={50} // Adjust the size as needed
                className="object-contain"
              />
            </div>
            {/* Front (image) */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-lg overflow-hidden">
              <Image
                src={card.image}
                alt="card"
                width={1000}
                height={1000}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
