import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";

export default function HeroSection() {

  const navigate = useNavigate();


  return (
    <>
      <div className="relative flex flex-col shrink-0 items-center space-y-5 w-full h-150 py-30 rounded-3xl mt-10 bg-[url('/images/globe.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 top-0 bg-blue-900/30 h-full rounded-3xl z-0"></div>
        <h2 className="font-semibold text-center z-10 text-[min(10vw,30px)]">
          <span className="text-[min(10vw,40px)]">
            Plan your trips with ease.
          </span>{" "}
          <span className="block">Discover places you would love.</span>
        </h2>
        <p className="z-10 text-center text-[min(10vw,15px)]">
          Explore everything from popular tourist spots to hidden gems and see
          where fellow travelers would love to go to
        </p>
        <button className="z-10 rounded-b-full" onClick={() => navigate(ROUTES.PUBLIC.EXPLORETRIPS)}>Start your journey</button>
        <div className="text-sm absolute bottom-20 left-20 text-white/80">Your portal to the <br/>rest of the world</div>
      </div>
    </>
  );
}
