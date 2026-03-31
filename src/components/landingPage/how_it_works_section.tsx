import { CiSearch } from "react-icons/ci";
import { IoAdd } from "react-icons/io5";
import { FaAngellist } from "react-icons/fa";

export default function HowItWorksSection() {
  return (
    <>
      <div className="flex flex-col text-black items-center w-full mb-20" id="how-it-works">
        <div className="py-10">
          <h2 className="font-bold text-2xl">How it Works?</h2>
        </div>
        <div className="flex justify-between">
          <div className="flex flex-col w-1/4 items-center gap-y-5">
            <div className="flex justify-center items-center rounded-xl h-15 w-15 bg-purple-400 text-white">
              <CiSearch />
            </div>
            <div className="flex flex-col gap-y-1 text-center">
              <h3 className="font-bold">Explore</h3>
              <p className="text-sm font-light">
                Explore popular destinations and trending wishlists
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center gap-x-3 h-fit">
            <div className="h-2 w-2 rounded-full bg-purple-400"></div>
            <p className="font-bold text-[min(10vw,30px)] text-black/20 pb-2">-------</p>
            <div className="h-2 w-2 rounded-full bg-cyan-300"></div>
          </div>
          <div className="flex flex-col w-1/4 items-center gap-y-5">
            <div className="flex justify-center items-center rounded-xl h-15 w-15 bg-cyan-300 text-white">
              <IoAdd />
            </div>
            <div className="flex flex-col gap-y-1 text-center">
              <h3 className="font-bold">Save</h3>
              <p className="text-sm font-light">
                Find a place you want to visit, save it
              </p>
            </div>
          </div>
           <div className="hidden lg:flex items-center justify-center gap-x-3 h-fit">
            <div className="h-2 w-2 rounded-full bg-cyan-300"></div>
            <p className="font-bold text-[min(10vw,30px)] text-black/20 pb-2">-------</p>
            <div className="h-2 w-2 rounded-full bg-purple-600"></div>
          </div>
          <div className="flex flex-col w-1/4 items-center gap-y-5">
            <div className="flex justify-center items-center rounded-xl h-15 w-15 bg-purple-600 text-white">
              <FaAngellist />
            </div>
            <div className="flex flex-col gap-y-1 text-center">
              <h3 className="font-bold">Create</h3>
              <p className="text-sm font-light">
                Create a wishlist of places you want to visit
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
