interface PProfilePublicProps {
	username: string;
}

function PProfilePublic({ username }: PProfilePublicProps) {
	return <div>{username}</div>;
}

export default PProfilePublic;
