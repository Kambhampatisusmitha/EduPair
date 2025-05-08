export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Share Your Skills",
      description: "Tell us what you can teach others and what you want to learn yourself."
    },
    {
      number: 2,
      title: "Get Matched",
      description: "Our algorithm finds people whose skills complement yours for perfect learning pairs."
    },
    {
      number: 3,
      title: "Learn Together",
      description: "Connect, schedule sessions, and track your progress as you exchange knowledge."
    }
  ];

  return (
    <div id="how-it-works" className="py-16 bg-white dark:bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-heading font-bold text-primary dark:text-white">How EduPair Works</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our platform connects people with complementary skills who want to learn from each other.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="bg-background dark:bg-background rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-accent dark:bg-accent-dark rounded-full flex items-center justify-center text-primary dark:text-primary-dark font-bold text-xl mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-heading font-semibold text-primary dark:text-white">{step.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
