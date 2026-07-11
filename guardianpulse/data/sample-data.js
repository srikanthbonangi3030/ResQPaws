// resQpaws Sample Demonstration Data
window.INITIAL_SAMPLE_DATA = {
  ngos: [
    {
      id: "ngo-1",
      name: "Happy Tails Rescue NGO",
      email: "srikanth@rescue.org",
      phone: "+91 98765 43210",
      city: "Bangalore",
      location: { lat: 12.9716, lng: 77.5946 }, // MG Road Area
      status: "Available", // Available, Busy, Offline
      rating: 4.8,
      rescuedCount: 142
    },
    {
      id: "ngo-2",
      name: "Paws & Claws Foundation",
      email: "pawsclaws@foundation.org",
      phone: "+91 87654 32109",
      city: "Bangalore",
      location: { lat: 12.9279, lng: 77.6271 }, // Koramangala
      status: "Busy",
      rating: 4.6,
      rescuedCount: 89
    },
    {
      id: "ngo-3",
      name: "Karuna Animal Helpline",
      email: "karuna@helpline.org",
      phone: "+91 76543 21098",
      city: "Bangalore",
      location: { lat: 13.0285, lng: 77.5896 }, // Hebbal
      status: "Offline",
      rating: 4.5,
      rescuedCount: 204
    }
  ],

  volunteers: [
    {
      id: "vol-1",
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      phone: "+91 99112 23344",
      city: "Bangalore",
      location: { lat: 12.9562, lng: 77.6045 } // Richmond Town
    },
    {
      id: "vol-2",
      name: "Priya Rao",
      email: "priya@outlook.com",
      phone: "+91 88223 34455",
      city: "Bangalore",
      location: { lat: 12.9345, lng: 77.6101 } // Indiranagar area
    },
    {
      id: "vol-3",
      name: "Kiran Kumar",
      email: "kiran@gmail.com",
      phone: "+91 77334 45566",
      city: "Bangalore",
      location: { lat: 13.0102, lng: 77.5685 } // Malleshwaram
    },
    {
      id: "vol-4",
      name: "Ananya Das",
      email: "ananya@yahoo.com",
      phone: "+91 66445 56677",
      city: "Bangalore",
      location: { lat: 12.9105, lng: 77.6450 } // HSR Layout
    }
  ],

  reports: [
    {
      id: "GP-2026-001",
      reporterId: "user-1",
      reporterName: "Jane Doe",
      contactNumber: "+91 91234 56789",
      animalType: "Dog",
      description: "Injured stray dog on the roadside, has a bleeding front leg and seems unable to walk properly.",
      imageUrl: "assets/placeholder.png",
      locationName: "Near MG Road Metro Station, Bangalore",
      lat: 12.9754,
      lng: 77.6062,
      severity: "Critical", // Critical, High, Medium, Low
      status: "Accepted", // Reported, Under Review, Accepted, Team Dispatched, Animal Rescued, Treatment Ongoing, Recovered
      confidence: 94,
      createdDate: "2026-06-01T10:15:00.000Z",
      assignedNgoId: "ngo-1",
      aiDetails: {
        injuryDetected: "Yes (Open wound on leg)",
        bloodVisible: "Yes (Moderate)",
        condition: "Dehydrated, weak",
        mobilityIssue: "Yes (Cannot bear weight on left forelimb)",
        distressLevel: "High"
      }
    },
    {
      id: "GP-2026-002",
      reporterId: "user-2",
      reporterName: "Amit Patel",
      contactNumber: "+91 92345 67890",
      animalType: "Cat",
      description: "Cat stuck in a barbed wire fence. Screaming in pain but doesn't look severely bleeding.",
      imageUrl: "assets/placeholder.png",
      locationName: "Koramangala 4th Block, Bangalore",
      lat: 12.9304,
      lng: 77.6230,
      severity: "High",
      status: "Team Dispatched",
      confidence: 88,
      createdDate: "2026-06-01T14:30:00.000Z",
      assignedNgoId: "ngo-2",
      aiDetails: {
        injuryDetected: "Yes (Entangled, minor scratches)",
        bloodVisible: "No",
        condition: "Highly distressed, aggressive",
        mobilityIssue: "Yes (Trapped)",
        distressLevel: "Very High"
      }
    },
    {
      id: "GP-2026-003",
      reporterId: "user-1",
      reporterName: "Jane Doe",
      contactNumber: "+91 91234 56789",
      animalType: "Cow",
      description: "Stray cow eating plastic from garbage and looking very weak, limping slowly.",
      imageUrl: "assets/placeholder.png",
      locationName: "Hebbal Flyover Junction, Bangalore",
      lat: 13.0350,
      lng: 77.5970,
      severity: "Medium",
      status: "Reported",
      confidence: 76,
      createdDate: "2026-06-01T18:45:00.000Z",
      assignedNgoId: null,
      aiDetails: {
        injuryDetected: "No obvious external cuts",
        bloodVisible: "No",
        condition: "Malnourished, lethargic",
        mobilityIssue: "Yes (Slight limp)",
        distressLevel: "Medium"
      }
    }
  ],

  lostFound: [
    {
      id: "lf-1",
      type: "Lost",
      animalType: "Dog",
      description: "Golden Retriever named Cooper, wearing a blue collar. Friendly but very scared of traffic.",
      location: "Indiranagar 80 Feet Road, Bangalore",
      contact: "+91 93456 78901",
      imageUrl: "assets/placeholder.png",
      date: "2026-05-30",
      keywords: "golden retriever, blue collar, cooper, friendly"
    },
    {
      id: "lf-2",
      type: "Found",
      animalType: "Cat",
      description: "White and gray cat found hiding in my garden. Has green eyes, wearing no collar. Very gentle.",
      location: "HSR Layout Sector 3, Bangalore",
      contact: "+91 94567 89012",
      imageUrl: "assets/placeholder.png",
      date: "2026-06-01",
      keywords: "white gray cat, green eyes, no collar, garden"
    }
  ],

  notifications: [
    {
      id: "notif-1",
      userId: "user-1",
      title: "Rescue Request Accepted",
      message: "Happy Tails Rescue NGO has accepted your rescue request for GP-2026-001.",
      date: "2026-06-01T10:45:00.000Z",
      read: false
    },
    {
      id: "notif-2",
      userId: "user-2",
      title: "Rescue Team Dispatched",
      message: "Paws & Claws Foundation has dispatched a rescue team for your request GP-2026-002.",
      date: "2026-06-01T15:00:00.000Z",
      read: false
    }
  ],

  adoptions: [
    {
      id: "adopt-1",
      name: "Luna",
      species: "Dog",
      breed: "Golden Retriever Mix",
      age: "2 Years",
      gender: "Female",
      size: "Large",
      location: "Bangalore South",
      photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80",
      status: "Available",
      dateAdded: "2026-05-15T10:00:00Z",
      vaccinated: true,
      spayed: true,
      healthStatus: "Fully recovered from minor paw injury. Energetic and healthy.",
      traits: ["Friendly", "Active", "Good with Kids"],
      story: "Luna was found abandoned near a construction site with a minor paw injury. Our NGO took her in, provided the necessary medical care, and gave her a lot of love. She is a very sweet and active girl who loves to play fetch and go on long walks."
    },
    {
      id: "adopt-2",
      name: "Milo",
      species: "Cat",
      breed: "Domestic Shorthair",
      age: "8 Months",
      gender: "Male",
      size: "Small",
      location: "Indiranagar, Bangalore",
      photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
      status: "Available",
      dateAdded: "2026-05-20T10:00:00Z",
      vaccinated: true,
      spayed: true,
      healthStatus: "Healthy and vaccinated.",
      traits: ["Playful", "Cuddly", "Indoor only"],
      story: "Milo was rescued from a heavy storm drain when he was just a tiny kitten. He has grown into a very affectionate boy who loves sitting on laps and chasing laser pointers."
    },
    {
      id: "adopt-3",
      name: "Rocky",
      species: "Dog",
      breed: "Indie",
      age: "4 Years",
      gender: "Male",
      size: "Medium",
      location: "Koramangala, Bangalore",
      photo: "https://images.unsplash.com/photo-1537151608804-ea6f1184cfe8?auto=format&fit=crop&w=600&q=80",
      status: "Available",
      dateAdded: "2026-05-25T10:00:00Z",
      vaccinated: true,
      spayed: true,
      healthStatus: "Healthy, requires regular exercise.",
      traits: ["Loyal", "Protective", "Smart"],
      story: "Rocky is a street-smart Indie dog who was rescued after a minor traffic accident. He has fully healed and is incredibly smart. He learns commands very quickly and forms a strong bond with his caretakers."
    }
  ],

  applications: []
};
