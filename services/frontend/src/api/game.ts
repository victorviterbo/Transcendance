export function  gameGetRoom(): string | undefined {
	const reg = /game\/(\d+)/gm;
	const res = reg.exec(location.href);
	if(!res || res.length < 2)
		return undefined
	return res[1];
}