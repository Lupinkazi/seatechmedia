import ServiceCard from "./ui/service-card";

export interface ServiceDefinition {
  id: string;
  title: string;
  description: string;
  href: string;
  variant: "royal" | "ice" | "navy" | "cyan" | "sky";
  imgAlt: string;
}

const services: ServiceDefinition[] = [
  {
    id: "media-production",
    title: "Media & Production",
    description:
      "Professional media production solutions that transform ideas into compelling visual experiences.",
    href: "#contact",
    variant: "royal",
    imgAlt: "Illustration of a professional cinema camera",
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    description:
      "Strategic digital marketing and creative advertising solutions that strengthen brand identity and audience reach.",
    href: "#contact",
    variant: "ice",
    imgAlt: "Illustration of a digital marketing megaphone",
  },
  {
    id: "online-media",
    title: "Online Media",
    description:
      "Digital publishing and online communication services designed to deliver information and engaging content across modern platforms.",
    href: "#contact",
    variant: "navy",
    imgAlt: "Illustration of a digital publication tablet",
  },
  {
    id: "event-management",
    title: "Event Management",
    description:
      "Professional event coverage, event coordination, and practical training programs for individuals and organizations.",
    href: "#contact",
    variant: "cyan",
    imgAlt: "Illustration of a stage microphone",
  },
  {
    id: "equipment-it",
    title: "Equipment & IT Solutions",
    description:
      "Technology, equipment, and digital infrastructure services to support modern businesses and creative professionals.",
    href: "#contact",
    variant: "sky",
    imgAlt: "Illustration of a modern laptop and technology setup",
  },
];

export default function Services() {
  return (
    <div className="services-react">
      <div className="section-heading">
        <p className="section-tag">OUR SERVICES</p>
        <h2>One Partner. Every Creative Solution.</h2>
      </div>
      <div className="services-grid">
        {services.map((service, index) => (
          <ServiceCard key={service.id} {...service} index={index} />
        ))}
      </div>
    </div>
  );
}
