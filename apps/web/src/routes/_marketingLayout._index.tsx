import type { Route } from "./+types/_marketingLayout._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CareerGPS" },
    { name: "description", content: "CareerGPS is a web application" },
  ];
}

export default function Home() {

  return (
    <></>
  );
}
