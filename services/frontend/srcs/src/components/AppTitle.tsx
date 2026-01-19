interface Props {
    count: number;
}

function AppTitle({ count }: Props) {
    return <h1>This is a counter: {count}</h1>;
}

export default AppTitle;
