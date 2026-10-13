# Repository Guidelines for UEA (Universal Emulation Anything)

## Product and Authority

UEA is a local-first, low-level hardware virtualization and silicon digital-twin platform. It turns physical microcontroller firmware, binary flash dumps, and logic analyzer traces into cycle-accurate, software-emulated digital twins without requiring physical chips or test benches.

1. **Evidence-First Silicon Provenance**: 
   Every claim regarding memory maps, register layouts, reset vectors, and bus timings must be anchored in verified Evidence:
   - **Observations**: Byte-exact file digests (SHA-256), raw logic analyzer transitions (VCD timestamps), CMSIS-SVD register nodes.
   - **Derivations**: Parsed memory regions, vector tables, interrupt mappings.
   - **Inferences**: Guessed peripheral addresses, inferred baud rates, hypothesized clock dividers.
   - **Unknowns**: Unmapped memory addresses, missing interrupt handlers, unmodeled peripheral behavior. Unmapped registers must remain explicit unknowns rather than silently returning zero.

2. **Multi-Engine Emulation Hierarchy**:
   UEA delegates execution to the appropriate virtualization runtime:
   - **Renode**: Complete SoC board-level emulation with sysbus interconnect, GPIO, timers, and external flash.
   - **QEMU System**: Full system-level emulation for Linux-on-ARM, MIPS routers, and complex microcontrollers.
   - **Unicorn Engine**: In-process cycle-level CPU instruction execution and basic-block memory tracing.

3. **Safe Virtual Hardware Synthesis**:
   Synthesized virtual peripherals must never execute native code directly on the host unsafely. Memory-mapped I/O (MMIO) read/write hooks must be sandboxed.

4. **Dual CLI / MCP Interface**:
   Every capability is accessible directly via terminal commands (`uea <command>`) and over stdio via Model Context Protocol (MCP) for autonomous AI agents.
