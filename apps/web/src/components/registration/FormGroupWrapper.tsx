interface FormGroupWrapperProps {
	title: string;
	children: React.ReactNode;
}

export default function FormGroupWrapper({
	children,
	title,
}: FormGroupWrapperProps) {
	return (
		<div className="relative rounded-lg border border-[#A6CDC4] p-5">
			<p className="absolute top-0 z-10 -translate-y-[20px] bg-background px-2 text-2xl font-extrabold">
				{title}
			</p>
			<div className="relative top-0 space-y-6">{children}</div>
		</div>
	);
}
