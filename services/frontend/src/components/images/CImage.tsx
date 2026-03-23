import { Box } from "@mui/material";
import type { GCompProps } from "../common/GProps";

interface CImageProps extends GCompProps {
	src?: string;
	alt: string;
}

function CImage({ src, alt }: CImageProps) {
	return <Box component="img" src={src} alt={alt}></Box>;
}

export default CImage;
