interface Testimonial {
  id: number;
  name: string;
  avatarUrl: string;
  teachSkill: string;
  learnSkill: string;
  quote: string;
}

export default function SuccessStories() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah J.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120",
      teachSkill: "Web Design",
      learnSkill: "French",
      quote: "I had been trying to learn French for years without much progress. Being paired with Thomas, a native speaker who wanted to learn web design, changed everything. Our weekly sessions have been invaluable!"
    },
    {
      id: 2,
      name: "Michael R.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120",
      teachSkill: "Data Science",
      learnSkill: "Guitar",
      quote: "As a busy professional, I never had time for guitar lessons. Finding someone who needed help with data analysis while being an excellent guitar teacher was perfect. EduPair made the connection seamless."
    }
  ];

  return (
    <div className="py-16 bg-white dark:bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-heading font-bold text-primary dark:text-white">Success Stories</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Hear from people who have transformed their learning through EduPair.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-background dark:bg-background rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.avatarUrl} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover mr-4" 
                />
                <div>
                  <h4 className="font-heading font-semibold text-primary dark:text-white">{testimonial.name}</h4>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Exchanged:</span>
                    <span className="text-sm skill-teach rounded-full px-2">{testimonial.teachSkill}</span>
                    <span className="mx-1 text-gray-500 dark:text-gray-400">for</span>
                    <span className="text-sm skill-learn rounded-full px-2">{testimonial.learnSkill}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "{testimonial.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
