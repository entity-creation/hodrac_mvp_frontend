import { FaHeart } from "react-icons/fa";

interface Props {
  name: string;
  description: string;
  cost: number;
  image: string;
}
export function PopularWishlists() {
  const demoWishlists = [
    {
      name: "Desert Dreams",
      description:
        "Experience Dubai past the luxury malls — desert safaris, old souks, dhow cruises, and hidden cafés locals love. A balance of adventure, culture, and relaxation.",
      cost: 1600,
      image: "/images/globe.jpg",
    },
    {
      name: "Desert Dreams",
      description:
        "Experience Dubai past the luxury malls — desert safaris, old souks, dhow cruises, and hidden cafés locals love. A balance of adventure, culture, and relaxation.",
      cost: 1600,
      image: "/images/globe.jpg",
    },
    {
      name: "Tokyo After Dark",
      description:
        "A deep dive into Tokyo’s neon nights — street food, late-night ramen, arcades, izakayas, and quiet shrines at dawn.",
      cost: 1600,
      image: "/images/globe.jpg",
    },
    {
      name: "Paris, But Local",
      description:
        "Skip the tourist traps. Discover Paris through cozy cafés, bookshops, hidden bakeries, sunset walks, and neighborhood markets.",
      cost: 1600,
      image: "/images/globe.jpg",
    },
    {
      name: "Santorini Without the Crowds",
      description:
        "Cliffside views, secret beaches, local tavernas, and quiet villages — Santorini beyond Instagram.",
      cost: 1600,
      image: "/images/globe.jpg",
    },
    {
      name: "Culture, Coast and Community",
      description:
        "Explore Ghana’s capital through food, music, beaches, markets, and cultural landmarks — with strong community vibes.",
      cost: 1300,
      image: "/images/globe.jpg",
    },
  ];
  return (
    <>
      <div className="flex flex-col items-center h-full w-full text-black my-20">
        <div
          className="flex flex-col gap-y-1 justify-center w-4/5 mb-20"
          id="text"
        >
          <h2 className="text-center font-bold text-[min(10vw,40px)]">
            Popular Travel Wishlists
          </h2>
          <p className="text-center text-black/40">
            Just like you explore, others do too browse places they love and
            find something for yourself.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-y-10 items-center h-fit md:pl-20 md:grid md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
        {demoWishlists.map((wishlist) => (
          <Wishlists
            name={wishlist.name}
            description={wishlist.description}
            cost={wishlist.cost}
            image={wishlist.image}
            key={wishlist.name}
          />
        ))}
      </div>
      <div className="flex justify-center text-black/40 w-full my-20 hover:text-black hover:cursor-pointer">
        Explore more...
      </div>
    </>
  );
}

export function Wishlists({ name, description, cost, image }: Props) {
  return (
    <>
      <div className="flex flex-col items-center gap-y-5 w-70">
        <div
          className={`h-50 w-70 rounded-2xl bg-[url('${image}')] bg-center bg-no-repeat bg-cover flex justify-end pt-2 pr-2 shadow-md shadow-gray-400`}
        >
          <button
            className={`h-6! w-6! rounded-full! bg-white/50! flex items-center justify-center p-1! m-01`}
          >
            {" "}
            <FaHeart />
          </button>
        </div>
        <div className="text-black">
          <h2 className="font-bold text-lg">{name}</h2>
          <p className="text-black/40 text-sm">{description}</p>
        </div>
        <div className="text-black flex justify-between w-full items-center">
          <h3 className="font-bold">${cost.toString()}</h3>
          <button className="text-white w-20 h-10 text-[10px]!">
            See More
          </button>
        </div>
      </div>
    </>
  );
}
