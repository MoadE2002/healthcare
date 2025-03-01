import { testimonials } from "../constants";
import Image from "next/image";

const Testimonials = ({ width, bg }) => {
  return (
    <div className={`mt-20 tracking-wide ${bg && "bg-white shadow rounded-lg p-6 mb-6"}`}>
      <h2 className={`${bg ? "text-xl font-semibold mb-4" : "text-3xl sm:text-5xl lg:text-6xl text-center my-10 lg:my-20"}`}>
        What People are Saying
      </h2>
      <div className="flex flex-wrap justify-center">
        {testimonials.map((testimonial, index) => (
          <div key={index} className={`w-full sm:w-1/2 lg:w-1/${width} px-4 py-2`}>
            <div className="rounded-md p-6 text-md border border-neutral-800 font-thin">
              <p>{testimonial.text}</p>
              <div className="flex mt-8 items-start">
                <Image
                  className="w-12 h-12 mr-6 rounded-full border border-neutral-300"
                  src={testimonial.image}
                  alt={testimonial.user}
                  width={48}
                  height={48}
                />
                <div>
                  <h6>{testimonial.user}</h6>
                  <span className="text-sm font-normal italic text-neutral-600">
                    {testimonial.company}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
