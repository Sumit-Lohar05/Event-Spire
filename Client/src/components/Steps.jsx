import { UserPlus, Search, Ticket } from "lucide-react";
import "./Steps.css";

function Steps(){
    const steps = [
        {
            id: 1,
            icon: <UserPlus />,
            color: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
            title: "Create an Account",
            description: "Join our community and set up your profile to start exploring."
        },
        {
            id: 2,
            icon: <Search />,
            color: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            title: "Find Your Events",
            description: "Browse through a variety of events and find what excites you."
        },
        {
            id: 3,
            icon: <Ticket />,
            color: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
            title: "Purchase Tickets",
            description: "Secure your spot by purchasing tickets easily and quickly."
        }
    ];
    return(
        <section id="steps" className="steps-section">
            <div className="section-header">
                <h1>How It Works</h1>
                <p>Your journey to unforgettable experiences in 3 simple steps</p>
            </div>
            <div className="steps-container">
                {steps.map((step)=>(
                    <div key={step.id} className="step-card">
                        <div className="step-number">{step.id}</div>
                        <div className="step-icon-wrapper" style={{ background: step.color }}>
                            {step.icon}
                        </div>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
export default Steps;