"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ToggleItemProps {
	name: string;
	path: string;
}

export default function SettingsSection({ name, path }: ToggleItemProps) {
	const currPath = usePathname();
	return (
		<Link href={path}>
			<div
				className={`w-full rounded-md px-5 py-3 transition-all duration-100 bg-[#D09C51] hover:bg-[#CCBA97] border-2 border-[#D09C51] ${
					(currPath.startsWith(path) &&
						path !== "/settings" &&
						path !== "/dash" &&
						path !== "/admin/toggles") ||
					currPath === path
						? "text-primary"
						: "text-muted-foreground"
				}`}
			>
				<p className="text-sm text-black">{name}</p>
			</div>
		</Link>
	);
}
