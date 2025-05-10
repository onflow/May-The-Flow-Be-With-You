import { Marquee } from '@/components/magicui/marquee';
import Image from 'next/image';

// Data structure for Ghibli transformations
interface GhibliTransformation {
	id: number;
	address: string;
	image: string;
}

// Mock data for marquee
const transformations: GhibliTransformation[] = [
	{
		id: 1,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli1',
	},
	{
		id: 2,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli2',
	},
	{
		id: 3,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli3',
	},
	{
		id: 4,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli4',
	},
	{
		id: 5,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli5',
	},
	{
		id: 6,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli6',
	},
	{
		id: 7,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli7',
	},
	{
		id: 8,
		address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
		image: '/placeholder.svg?key=ghibli8',
	},
];

// Split transformations into two rows for alternating directions
const firstRow = transformations.slice(0, transformations.length / 2);
const secondRow = transformations.slice(transformations.length / 2);

// Card component for each Ghibli transformation
const TransformationCard = ({
	address,
	image,
}: Omit<GhibliTransformation, 'id'>) => {
	return (
		<div className="border rounded-lg p-3 flex items-center gap-3 w-68 bg-white">
			<div className="relative h-20 w-20 overflow-hidden rounded-md">
				<Image
					src="/placeholder.jpeg"
					alt="Ghibli avatar"
					fill
					sizes="(max-width: 768px) 100vw, 50vw"
					className="object-cover"
				/>
			</div>
			<div className="text-left space-y-3">
				<div>
					<p className="text-sm truncate w-36">{address}</p>
					<p className="text-sm font-medium flex items-center gap-1">
						turned on Ghibli Mode 💚
					</p>
				</div>
				<p className="text-sm text-gray-500">#GhibliWithTheFlow</p>
			</div>
		</div>
	);
};

export function GhibliMarquee() {
	return (
		<div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-4">
			<Marquee pauseOnHover className="[--duration:30s]">
				{firstRow.map((transformation) => (
					<TransformationCard
						key={transformation.id}
						address={transformation.address}
						image={transformation.image}
					/>
				))}
			</Marquee>
			<Marquee reverse pauseOnHover className="[--duration:30s]">
				{secondRow.map((transformation) => (
					<TransformationCard
						key={transformation.id}
						address={transformation.address}
						image={transformation.image}
					/>
				))}
			</Marquee>
			<div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
		</div>
	);
}
