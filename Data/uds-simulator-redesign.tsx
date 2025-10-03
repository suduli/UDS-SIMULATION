import React, { useState, useEffect } from 'react';
import { Send, Zap, Shield, Radio, Database, Play, Trash2, Download, BookOpen, Settings } from 'lucide-react';

const UDSSimulator = () => {
  const [session, setSession] = useState('Extended Session');
  const [response, setResponse] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedService, setSelectedService] = useState('0x10');
  const [subFunction, setSubFunction] = useState('03');

  const services = [
    { id: '0x10', name: 'Diagnostic Session Control', icon: '🎯', color: 'from-cyan-500 to-blue-500' },
    { id: '0x11', name: 'ECU Reset', icon: '🔄', color: 'from-purple-500 to-pink-500' },
    { id: '0x14', name: 'Clear Diagnostic Information', icon: '🗑️', color: 'from-red-500 to-orange-500' },
    { id: '0x19', name: 'Read DTC Information', icon: '📊', color: 'from-green-500 to-emerald-500' },
    { id: '0x22', name: 'Read Data By Identifier', icon: '📖', color: 'from-yellow-500 to-amber-500' },
    { id: '0x27', name: 'Security Access', icon: '🔐', color: 'from-indigo-500 to-violet-500' },
  ];

  const handleSendRequest = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setResponse({
        bytes: ['50', '03', '00', '32', '01', 'F4'],
        explanations: [
          { byte: '50', desc: 'Positive Response', icon: '✓' },
          { byte: '03', desc: 'Extended Session', icon: '→' },
          { byte: '00', desc: 'Session Parameter', icon: '→' },
          { byte: '32', desc: 'P2 Server Max (50ms)', icon: '→' },
          { byte: '01', desc: 'P2* High Byte', icon: '→' },
          { byte: 'F4', desc: 'P2* Low Byte (500ms)', icon: '→' },
        ],
        status: 'Session Changed Successfully',
        time: '8ms'
      });
      setIsAnimating(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-pulse">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                UDS Protocol Simulator
              </h1>
              <p className="text-slate-400 text-sm">Unified Diagnostic Services Training Platform</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg hover:bg-slate-800/80 transition-all flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Tutorials
            </button>
            <button className="px-4 py-2 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg hover:bg-slate-800/80 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="px-4 py-2 bg-slate-800/50 backdrop-blur border border-cyan-500/30 rounded-lg hover:bg-slate-800/80 transition-all flex items-center gap-2">
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>

        {/* Protocol State Dashboard */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:shadow-cyan-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm uppercase tracking-wider">Session</span>
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
              </div>
              <div className="text-2xl font-bold text-cyan-400 mb-2">{session}</div>
              <div className="flex gap-1 mb-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded ${i < 5 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                ))}
              </div>
              <div className="text-xs text-slate-500">Timeout: 5s</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:shadow-purple-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm uppercase tracking-wider">Security</span>
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400 mb-2">🔒 Locked</div>
              <div className="text-xs text-slate-500">Attempts: 0/3</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-green-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:shadow-green-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm uppercase tracking-wider">Communication</span>
                <Radio className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400 mb-2">✓ Enabled</div>
              <div className="text-xs text-slate-500">Tx: 1.2k | Rx: 856</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-slate-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:shadow-slate-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm uppercase tracking-wider">Data Transfer</span>
                <Database className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-400 mb-2">Idle</div>
              <div className="flex gap-0.5 h-8 items-end">
                {[2,4,6,3,8,5,2,4,9,6,3,1].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-600 rounded-t" style={{height: `${h*10}%`}} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Request Builder */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/30 px-6 py-4">
              <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                🛠️ Request Builder
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Service Selection */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block uppercase tracking-wider">Select Service</label>
                <div className="grid grid-cols-2 gap-3">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedService === service.id
                          ? 'border-cyan-400 bg-gradient-to-br ' + service.color + ' shadow-lg'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">{service.icon}</div>
                      <div className="text-xs font-medium">{service.id}</div>
                      <div className="text-xs text-slate-400 mt-1">{service.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block uppercase tracking-wider">Sub-Function</label>
                <div className="relative">
                  <select
                    value={subFunction}
                    onChange={(e) => setSubFunction(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none transition-colors"
                  >
                    <option value="01">01 - Default Session</option>
                    <option value="02">02 - Programming Session</option>
                    <option value="03">03 - Extended Session</option>
                  </select>
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block uppercase tracking-wider">📚 Quick Templates</label>
                <div className="flex flex-wrap gap-2">
                  {['Extended Session', 'Security Seed', 'Read VIN', 'Read DTCs', 'ECU Reset'].map(template => (
                    <button
                      key={template}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs hover:border-cyan-500 hover:text-cyan-400 transition-all"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-2">Preview:</div>
                <div className="font-mono text-cyan-400 text-lg">10 {subFunction}</div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendRequest}
                disabled={isAnimating}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnimating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Visualizer */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-green-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                📡 Response Visualizer
              </h2>
              <button className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs hover:border-green-500 transition-all flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Request Echo */}
              <div className="border-l-4 border-cyan-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">◀━━ REQUEST</span>
                  <span className="text-xs text-slate-500">18:04:07.621</span>
                </div>
                <div className="font-mono text-cyan-400 text-lg mb-1">10 {subFunction}</div>
                <div className="text-xs text-slate-500">Diagnostic Session Control</div>
              </div>

              {/* Response */}
              {response && (
                <div className="border-l-4 border-green-500 pl-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-green-400 uppercase tracking-wider">◀━━ POSITIVE RESPONSE</span>
                    <span className="text-xs text-slate-500">⏱️ {response.time}</span>
                  </div>

                  <div className="bg-slate-900/80 border border-green-500/30 rounded-xl p-4 mb-3">
                    <div className="font-mono text-green-400 text-lg mb-3">
                      {response.bytes.join(' ')}
                    </div>
                    <div className="flex gap-2 mb-4">
                      {response.bytes.map((byte, i) => (
                        <div key={i} className="flex-1 bg-green-500/20 border border-green-500/50 rounded-lg p-2 text-center">
                          <div className="font-mono text-green-300">{byte}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {response.explanations.map((exp, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-slate-500">[{i}]:</span>
                          <span className="text-green-400 font-mono">0x{exp.byte}</span>
                          <span className="text-slate-400">{exp.icon}</span>
                          <span className="text-slate-300">{exp.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    <div>
                      <div className="text-sm font-medium text-green-400">{response.status}</div>
                      <div className="text-xs text-slate-500">Response Time: {response.time} (within P2)</div>
                    </div>
                  </div>

                  {/* Protocol Trace Timeline */}
                  <div className="mt-4">
                    <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Protocol Trace Timeline</div>
                    <div className="flex gap-0.5 h-12 items-end bg-slate-900/50 rounded-lg p-2">
                      {[1,1,3,8,9,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-green-500 to-cyan-500 rounded-t transition-all" 
                          style={{height: `${h*10}%`}} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!response && (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-3">📡</div>
                  <div className="text-sm">Waiting for request...</div>
                  <div className="text-xs mt-1">Send a request to see the response</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Features Section */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          {/* DTC Management */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-orange-500/30 rounded-2xl p-6 shadow-xl hover:shadow-orange-500/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-xl">🔍</span>
              </div>
              <div>
                <h3 className="font-bold text-orange-400">DTC Management</h3>
                <p className="text-xs text-slate-500">Diagnostic Trouble Codes</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-orange-400">P0420</span>
                  <span className="text-xs text-slate-400">Confirmed</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Catalyst System Efficiency</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-orange-400">P0171</span>
                  <span className="text-xs text-slate-400">Pending</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">System Too Lean Bank 1</div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-orange-500/20 border border-orange-500/50 rounded-lg text-sm text-orange-400 hover:bg-orange-500/30 transition-all">
              View All DTCs
            </button>
          </div>

          {/* Learning Center */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-purple-500/30 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-purple-400">Learning Center</h3>
                <p className="text-xs text-slate-500">Interactive Tutorials</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between hover:border-purple-500/50 transition-all cursor-pointer">
                <div>
                  <div className="text-sm text-purple-400">Session Control</div>
                  <div className="text-xs text-slate-500">5 lessons</div>
                </div>
                <div className="text-xs text-green-400">✓</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between hover:border-purple-500/50 transition-all cursor-pointer">
                <div>
                  <div className="text-sm text-purple-400">Security Access</div>
                  <div className="text-xs text-slate-500">7 lessons</div>
                </div>
                <div className="text-xs text-yellow-400">3/7</div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-sm text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Continue Learning
            </button>
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-cyan-500/30 rounded-2xl p-6 shadow-xl hover:shadow-cyan-500/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-cyan-400">Session Stats</h3>
                <p className="text-xs text-slate-500">Current Activity</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-2xl font-bold text-cyan-400">247</div>
                <div className="text-xs text-slate-500">Requests Sent</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-2xl font-bold text-green-400">98%</div>
                <div className="text-xs text-slate-500">Success Rate</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-2xl font-bold text-purple-400">12</div>
                <div className="text-xs text-slate-500">Services Used</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-2xl font-bold text-orange-400">5</div>
                <div className="text-xs text-slate-500">Active DTCs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UDSSimulator;