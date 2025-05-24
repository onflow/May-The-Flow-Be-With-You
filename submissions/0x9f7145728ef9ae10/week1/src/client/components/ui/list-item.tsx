import Image from "next/image";
import tick from "../../app/assets/tick.png";
import link from "../../app/assets/external-link.png";

// Define the props interface
interface ListItemProps {
  title: string;
  haveLink: boolean;
  hash?: string; // hash is optional, it might be undefined if there's no link
}

const ListItem: React.FC<ListItemProps> = ({ title, haveLink, hash }) => {
  return (
    <li className="flex items-center justify-between bg-white shadow-xs rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 mb-5 border-gray-100 border-2 w-full">
      {/* Left Icon and Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Image
          src={tick}
          alt="Tick"
          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
        />
        <span className="text-gray-800 text-base sm:text-lg md:text-xl lg:text-2xl font-medium pr-30">
          {title}
        </span>
      </div>

      {/* Right Link Icon */}
      {haveLink && hash && (
        <a
          href={`https://evm-testnet.flowscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={link}
            alt="External link"
            className="w-5 h-5 sm:w-6 sm:h-6 opacity-60 hover:opacity-100 transition ml-3"
          />
        </a>
      )}
    </li>
  );
};

export default ListItem;
