import { useEffect, useState } from 'react';
import { listEmergencyNumbers, updateEmergencyNumber } from '../services/adminData';
import type { EmergencyNumber } from '../types';

export function EmergencyNumbersPage({ actorId }: { actorId: string }) {
  const [numbers, setNumbers] = useState<EmergencyNumber[]>([]);
  const refresh = () => listEmergencyNumbers().then(setNumbers);
  useEffect(() => { void refresh(); }, []);

  return (
    <section>
      <h2>Emergency Numbers</h2>
      <table>
        <thead><tr><th>Country</th><th>Police</th><th>Ambulance</th><th>Fire</th><th>Confidence</th><th /></tr></thead>
        <tbody>
          {numbers.map((item) => (
            <tr key={item.id}>
              <td>{item.countryName}</td>
              <td>{item.police}</td>
              <td>{item.ambulance}</td>
              <td>{item.fire}</td>
              <td>{item.confidence}</td>
              <td>
                <button
                  onClick={() =>
                    {
                      const police = window.prompt('Police number', item.police);
                      const ambulance = window.prompt('Ambulance number', item.ambulance);
                      const fire = window.prompt('Fire number', item.fire);
                      const confidence = window.prompt('Confidence: high, medium, or low', item.confidence);
                      if (!police || !ambulance || !fire) return;
                      if (confidence !== 'high' && confidence !== 'medium' && confidence !== 'low') return;
                      void updateEmergencyNumber(
                        item.id,
                        { police, ambulance, fire, confidence },
                        actorId,
                      ).then(refresh);
                    }
                  }
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
