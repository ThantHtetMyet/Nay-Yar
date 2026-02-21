import React from 'react';

const DefaultPage = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            {/* Header Navbar */}
            <div style={{
                height: '70px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                padding: '0 40px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                justifyContent: 'space-between',
                zIndex: 10
            }}>
                <h1 style={{ fontSize: '1.4rem', color: '#0072ff', fontWeight: 'bold', margin: 0 }}>Nay-Yar Map Operations</h1>
                <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Jurong West Street 91 Overview</div>
            </div>

            {/* Google Map Container */}
            <div style={{ flex: 1, position: 'relative' }}>
                <iframe
                    title="Jurong West Default Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.132801452932!2d103.6826131!3d1.3435166!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da0f8b7f731cd9%3A0xe5a3c2670e9a7e3d!2sJurong%20West%20Street%2091!5e0!3m2!1sen!2ssg!4v1714521404017!5m2!1sen!2ssg"
                ></iframe>
            </div>
        </div>
    );
};

export default DefaultPage;
