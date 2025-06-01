import random
import time
import uuid
from typing import Dict, List, Optional, Tuple
import matplotlib.pyplot as plt
import numpy as np

# --- Constantes de Simulación ---
TIMESTEPS_POR_DIA_SIMULADO = 300
DIA_EN_SEGUNDOS_SIMULADOS = 60.0 # Para pruebas: 1 día simulado = 1 minuto. Cambiar a 24*60*60 para real.
MAX_CRIATURAS_POR_AMBIENTE = 5
PROBABILIDAD_REPRODUCCION_DIARIA_POR_PAREJA = 0.25 # Aumentado para más acción en sim corta

# --- Configuración de Genes ---
GENES_VISIBLES_DEFAULT = {
    "colorR": (0.0, 1.0), "colorG": (0.0, 1.0), "colorB": (0.0, 1.0),
    "tamañoBase": (0.5, 3.0),
    "formaPrincipal": (1, 3), # 1: esfera, 2: cubo, 3: pirámide
    "numApendices": (0, 8),
    "patronMovimiento": (1, 4) # 1: Estático, 2: Circular, 3: Patrulla, 4: Errático
}
GENES_OCULTOS_DEFAULT = {
    "tasaMetabolica": (0.5, 1.5), "fertilidad": (0.1, 0.9),
    "potencialEvolutivo": (0.5, 1.5),
    "max_lifespan_dias_base": (3.0, 7.0), # Días simulados, acortado para pruebas
    "puntosSaludMax": (50.0, 200.0),
    "ataqueBase": (5.0, 25.0),
    "defensaBase": (5.0, 25.0),
    "agilidadCombate": (0.5, 2.0)
}

# --- Factores de Evolución ---
TASA_APRENDIZAJE_HOMEOSTASIS_BASE = 0.05
TASA_EVOLUCION_PASIVA_GEN_BASE = 0.001 # Cambio base por timestep
FACTOR_GANANCIA_EP_POR_TIMESTEP = 0.002  # Aumentado de 0.0002 a 0.002
FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE = 0.0001 # Cuánto influye un gen visible en uno de combate, por timestep

# --- Constantes para FNV-1a Hash (ejemplo) ---
FNV_PRIME_64 = 1099511627776
FNV_OFFSET_BASIS_64 = 14695981039346656037

def fnv1a_64(data_str: str) -> int:
    """Calcula un hash FNV-1a de 64 bits para una cadena."""
    hash_val = FNV_OFFSET_BASIS_64
    for byte_char in data_str.encode('utf-8'):
        hash_val = (hash_val ^ byte_char) * FNV_PRIME_64
        hash_val &= 0xffffffffffffffff # Asegurar que sea un UInt64
    return hash_val

def simple_hash(seed_str: str) -> int:
    """Función de hash simple para derivación determinista."""
    return fnv1a_64(seed_str)

def clamp(valor, minimo, maximo):
    return max(minimo, min(valor, maximo))

class Criatura:
    def __init__(self, nombre: str, birth_timestamp: float, id_criatura: Optional[str] = None, ep_inicial: Optional[float] = None, genes_padre1: Optional[Dict] = None, genes_padre2: Optional[Dict] = None):
        self.id: str = id_criatura if id_criatura else uuid.uuid4().hex[:8]
        self.nombre: str = nombre
        self.esta_viva: bool = True
        
        self.birth_timestamp: float = birth_timestamp
        self.last_evolution_processed_timestamp: float = birth_timestamp
        self.last_seed_generation_timestamp: float = birth_timestamp
        self.current_daily_random_seeds: List[int] = self._generate_new_daily_seeds()

        self.edad_dias_completos: float = 0.0 # Días simulados vividos
        self.edad_timesteps_evolutivos_total: int = 0

        self.genes_visibles: Dict[str, float] = {}
        self.genes_ocultos: Dict[str, float] = {}
        self.homeostasis_targets: Dict[str, float] = {}

        if genes_padre1 and genes_padre2: # Herencia
            self._heredar_genes(genes_padre1, genes_padre2)
        else: # Generación inicial
            for gen, (min_val, max_val) in GENES_VISIBLES_DEFAULT.items():
                self.genes_visibles[gen] = float(random.randint(min_val, max_val)) if isinstance(min_val, int) else random.uniform(min_val, max_val)
            for gen, (min_val, max_val) in GENES_OCULTOS_DEFAULT.items():
                self.genes_ocultos[gen] = random.uniform(min_val, max_val)

        self.puntos_evolucion: float = ep_inicial if ep_inicial is not None else random.uniform(10.0, 25.0)
        base_lifespan = self.genes_ocultos["max_lifespan_dias_base"]
        self.lifespan_total_dias: float = random.uniform(base_lifespan * 0.9, base_lifespan * 1.1)
        
        print(f"    Criatura creada: {self.nombre} (ID: {self.id}), Nacimiento: {self.birth_timestamp:.2f}s, EP_inicial: {self.puntos_evolucion:.1f}, Vida: {self.lifespan_total_dias:.1f}d")

    def _heredar_genes(self, genes_p1: Dict, genes_p2: Dict):
        # Simple herencia y mutación (adaptar de la versión anterior)
        for gen_nombre, (min_val, max_val) in GENES_VISIBLES_DEFAULT.items():
            val_p1 = genes_p1['visibles'][gen_nombre]
            val_p2 = genes_p2['visibles'][gen_nombre]
            gen_cria = random.choice([val_p1, val_p2])
            if random.random() < 0.1: # Mutación
                cambio = random.choice([-1,1]) if isinstance(min_val,int) else random.uniform(-(max_val-min_val)*0.05, (max_val-min_val)*0.05)
                gen_cria += cambio
            self.genes_visibles[gen_nombre] = float(round(clamp(gen_cria, min_val, max_val))) if isinstance(min_val,int) else clamp(gen_cria, min_val, max_val)

        for gen_nombre, (min_val, max_val) in GENES_OCULTOS_DEFAULT.items():
            val_p1 = genes_p1['ocultos'][gen_nombre]
            val_p2 = genes_p2['ocultos'][gen_nombre]
            gen_cria = (val_p1 + val_p2) / 2
            if random.random() < 0.05: # Mutación
                cambio = random.uniform(-(max_val-min_val)*0.05, (max_val-min_val)*0.05)
                gen_cria += cambio
            self.genes_ocultos[gen_nombre] = clamp(gen_cria, min_val, max_val)

    def _generate_new_daily_seeds(self) -> List[int]:
        # print(f"      {self.nombre}: Generando nuevas semillas diarias.")
        return [random.randint(0, 2**32 - 1) for _ in range(5)] # Simula obtención de Flow

    def _aplicar_cambio_gen(self, gen_nombre: str, cambio: float):
        if gen_nombre in self.genes_visibles:
            min_val, max_val = GENES_VISIBLES_DEFAULT[gen_nombre]
            self.genes_visibles[gen_nombre] += cambio
            if isinstance(min_val, int): # Asegurar que los genes enteros permanezcan enteros
                self.genes_visibles[gen_nombre] = float(round(self.genes_visibles[gen_nombre]))
            self.genes_visibles[gen_nombre] = clamp(self.genes_visibles[gen_nombre], min_val, max_val)

    def _aplicar_cambio_gen_oculto(self, gen_nombre: str, cambio: float):
        if gen_nombre in self.genes_ocultos:
            min_val, max_val = GENES_OCULTOS_DEFAULT[gen_nombre]
            self.genes_ocultos[gen_nombre] += cambio
            # Los genes ocultos suelen ser flotantes, no necesitan redondeo especial a menos que se defina
            self.genes_ocultos[gen_nombre] = clamp(self.genes_ocultos[gen_nombre], min_val, max_val)

    def _evolucion_un_timestep(self, timestep_in_day: int):
        if not self.esta_viva: return

        # Roles de las semillas (R0-R4)
        R0_volatilidad, R1_semilla_pasiva, R2_boost_homeo, R3_semilla_homeo_efec, R4_semilla_evento = self.current_daily_random_seeds

        daily_volatility_factor = 0.5 + ((R0_volatilidad % 1000) / 999.0) # 0.5 a 1.5
        daily_homeostasis_boost = 0.8 + ((R2_boost_homeo % 1000) / 999.0) * 0.4 # 0.8 a 1.2

        # 1. Ganancia de EP - Mejorada con factor de edad y volatilidad
        factor_edad = 1.0 + (self.edad_dias_completos * 0.1)  # Crece 10% adicional por cada día vivido
        ep_ganancia_base = self.genes_ocultos["potencialEvolutivo"] * FACTOR_GANANCIA_EP_POR_TIMESTEP * 10.0  # x10
        self.puntos_evolucion += ep_ganancia_base * factor_edad * daily_volatility_factor
        
        # 2. Evolución de Genes Visibles (Homeostasis y Pasiva)
        for gene_idx, gen_nombre in enumerate(list(self.genes_visibles.keys())): # Usar list() si se modifica el dict
            # Derivación determinista para evolución pasiva
            hash_input_pasiva = f"{R1_semilla_pasiva}-{timestep_in_day}-{gene_idx}"
            pseudo_rand_pasiva = simple_hash(hash_input_pasiva) % 10000
            factor_cambio_pasivo_norm = (pseudo_rand_pasiva / 9999.0) - 0.5 # -0.5 a 0.5

            # Derivación determinista para efectividad de homeostasis
            hash_input_homeo_efec = f"{R3_semilla_homeo_efec}-{timestep_in_day}-{gene_idx}"
            pseudo_rand_homeo_efec = simple_hash(hash_input_homeo_efec) % 10000
            efectividad_timestep_homeo = 0.8 + (pseudo_rand_homeo_efec / 9999.0) * 0.4 # 0.8 a 1.2

            if gen_nombre in self.homeostasis_targets:
                # Homeostasis
                actual_valor = self.genes_visibles[gen_nombre]
                target_valor = self.homeostasis_targets[gen_nombre]
                diferencia = target_valor - actual_valor
                cambio_base = diferencia * TASA_APRENDIZAJE_HOMEOSTASIS_BASE * self.genes_ocultos["potencialEvolutivo"]
                cambio_final = cambio_base * efectividad_timestep_homeo * daily_homeostasis_boost
                self._aplicar_cambio_gen(gen_nombre, cambio_final)
            else:
                # Evolución Pasiva
                cambio_pasivo = factor_cambio_pasivo_norm * TASA_EVOLUCION_PASIVA_GEN_BASE * self.genes_ocultos["potencialEvolutivo"] * daily_volatility_factor
                self._aplicar_cambio_gen(gen_nombre, cambio_pasivo)

        # 3. Evolución Pasiva de Genes Ocultos (con influencias para combate)
        # Pre-calcular normalizaciones de genes visibles relevantes una vez para este timestep
        min_tb, max_tb = GENES_VISIBLES_DEFAULT["tamañoBase"]
        norm_tamaño_base = (self.genes_visibles["tamañoBase"] - min_tb) / (max_tb - min_tb) if (max_tb - min_tb) != 0 else 0.5
        tend_tamaño_norm_factor = (norm_tamaño_base - 0.5) * 2 # Rango -1 a 1, centro 0

        min_na, max_na = GENES_VISIBLES_DEFAULT["numApendices"]
        # Normalización para numApendices (0 a 1)
        norm_num_apendices = (self.genes_visibles["numApendices"] - min_na) / (max_na - min_na) if (max_na - min_na) != 0 else 0.5
        
        forma_actual = self.genes_visibles["formaPrincipal"] # Entero
        apendices_actuales = self.genes_visibles["numApendices"] # Entero

        genes_ocultos_a_procesar = list(self.genes_ocultos.keys())
        offset_idx_oculto = len(self.genes_visibles) # Para generar hashes diferentes a los visibles

        for gene_idx_oculto, gen_nombre_oculto in enumerate(genes_ocultos_a_procesar):
            # No evolucionar estos genes ocultos aquí si tienen su propia lógica o son estáticos post-nacimiento
            if gen_nombre_oculto in ["tasaMetabolica", "fertilidad", "potencialEvolutivo", "max_lifespan_dias_base"]:
                continue

            hash_input_pasiva_oculto = f"{R1_semilla_pasiva}-{timestep_in_day}-{offset_idx_oculto + gene_idx_oculto}"
            pseudo_rand_pasiva_oculto = simple_hash(hash_input_pasiva_oculto) % 10000
            factor_cambio_pasivo_norm_oculto = (pseudo_rand_pasiva_oculto / 9999.0) - 0.5 

            # Cambio base aleatorio pasivo
            cambio_base_pasivo_oculto = (factor_cambio_pasivo_norm_oculto * 
                                  TASA_EVOLUCION_PASIVA_GEN_BASE * 
                                  self.genes_ocultos["potencialEvolutivo"] * 
                                  daily_volatility_factor)
            
            modificador_influencia_especifico = 0.0 # Suma de todas las tendencias de influencia para este gen

            if gen_nombre_oculto == "puntosSaludMax":
                tendencia_tamaño = tend_tamaño_norm_factor * 1.0  # Mayor tamaño, más salud (factor 1.0)
                tendencia_forma = 0.0
                if forma_actual == 2: tendencia_forma = 0.5  # Cubo es robusto (factor 0.5)
                modificador_influencia_especifico = (tendencia_tamaño + tendencia_forma)

            elif gen_nombre_oculto == "ataqueBase":
                tendencia_forma = 0.0
                if forma_actual == 3: tendencia_forma = 1.0    # Pirámide es agresiva (factor 1.0)
                elif forma_actual == 1: tendencia_forma = -0.3 # Esfera menos apta para ataque (factor -0.3)
                
                # numApendices: más es mejor, usa norm_num_apendices (0 a 1)
                tendencia_apendices = norm_num_apendices * 0.7 # Más apéndices, más ataque (factor 0.7)
                
                tendencia_tamaño = tend_tamaño_norm_factor * 0.3 # Tamaño influye poco en ataque (factor 0.3)
                modificador_influencia_especifico = (tendencia_forma + tendencia_apendices + tendencia_tamaño)
            
            elif gen_nombre_oculto == "defensaBase":
                tendencia_forma = 0.0
                if forma_actual == 2: tendencia_forma = 1.0    # Cubo es defensivo (factor 1.0)
                elif forma_actual == 3: tendencia_forma = -0.3 # Pirámide expuesta (factor -0.3)
                
                tendencia_tamaño = tend_tamaño_norm_factor * 1.0  # Mayor tamaño, más defensa (factor 1.0)
                modificador_influencia_especifico = (tendencia_forma + tendencia_tamaño)

            elif gen_nombre_oculto == "agilidadCombate":
                tendencia_forma = 0.0
                if forma_actual == 1: tendencia_forma = 1.0    # Esfera es ágil (factor 1.0)
                elif forma_actual == 2: tendencia_forma = -0.7 # Cubo es torpe (factor -0.7)
                
                tendencia_tamaño = -tend_tamaño_norm_factor * 1.0 # Mayor tamaño, menos ágil (factor -1.0)
                
                # numApendices: U-shape, óptimo en el medio del rango (0-8 -> óptimo 4)
                # ((1.0 - abs(valor_actual - óptimo) / dist_max_desde_óptimo) - 0.5) * 2 -> rango -1 a +1
                optimo_apendices = (min_na + max_na) / 2.0
                dist_max_desde_optimo_ap = (max_na - min_na) / 2.0
                if dist_max_desde_optimo_ap == 0: # Evitar división por cero si el rango es un solo número
                    tendencia_apendices_u_shape = 0.0
                else:
                    tendencia_apendices_u_shape = ((1.0 - abs(apendices_actuales - optimo_apendices) / dist_max_desde_optimo_ap) - 0.5) * 2.0 
                
                modificador_influencia_especifico = (tendencia_forma + tendencia_tamaño + tendencia_apendices_u_shape * 0.5) # Factor 0.5 para apéndices en agilidad

            cambio_total_oculto = cambio_base_pasivo_oculto
            # Aplicar influencia solo a genes de combate
            if gen_nombre_oculto in ["puntosSaludMax", "ataqueBase", "defensaBase", "agilidadCombate"]:
                cambio_influencia = modificador_influencia_especifico * FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE * self.genes_ocultos["potencialEvolutivo"] * daily_volatility_factor
                cambio_total_oculto += cambio_influencia

            self._aplicar_cambio_gen_oculto(gen_nombre_oculto, cambio_total_oculto)
        
        self.edad_timesteps_evolutivos_total += 1

    def _procesar_fin_dia_eventos(self, current_timestamp:float):
        """Se llama cuando se completa un día simulado."""
        # R4 es para evento diario menor o modificador de EP
        R4_semilla_evento = self.current_daily_random_seeds[4]
        
        # Ejemplo: Modificador de EP basado en R4
        ep_modifier_factor = ((R4_semilla_evento % 1000) / 999.0) - 0.5  # -0.5 a +0.5
        ep_change_ratio = 0.01 # Cambia EP hasta en +/- 1%
        ep_change_abs = self.puntos_evolucion * ep_change_ratio * ep_modifier_factor
        # print(f"      {self.nombre}: Evento fin de día R4. EP change: {ep_change_abs:.2f}")
        self.puntos_evolucion += ep_change_abs
        self.puntos_evolucion = max(0.1, self.puntos_evolucion) # No dejar que baje demasiado o negativo

    def envejecer_y_verificar_muerte(self) -> bool:
        """Incrementa la edad en un día y verifica si muere. Devuelve True si sigue viva."""
        self.edad_dias_completos += 1
        if self.edad_dias_completos >= self.lifespan_total_dias:
            self.esta_viva = False
            print(f"    ¡EVENTO! {self.nombre} ha muerto de vejez a los {self.edad_dias_completos:.1f} días simulados (Vida max: {self.lifespan_total_dias:.1f}d).")
        return self.esta_viva

    def actualizar_estado_hasta(self, target_timestamp: float, ambiente_id_usuario: str) -> bool:
        """Calcula la evolución hasta target_timestamp. Devuelve True si sigue viva."""
        if not self.esta_viva or target_timestamp <= self.last_evolution_processed_timestamp:
            return self.esta_viva

        # print(f"    {self.nombre}: Actualizando de {self.last_evolution_processed_timestamp:.2f}s a {target_timestamp:.2f}s")
        
        current_processing_time = self.last_evolution_processed_timestamp
        timestep_duration = DIA_EN_SEGUNDOS_SIMULADOS / TIMESTEPS_POR_DIA_SIMULADO

        while current_processing_time < target_timestamp and self.esta_viva:
            # ¿Es momento de un nuevo "día de semillas" y eventos de fin de día?
            # Esto ocurre si el tiempo actual de procesamiento ha cruzado el inicio del siguiente día de semillas.
            if current_processing_time >= self.last_seed_generation_timestamp + DIA_EN_SEGUNDOS_SIMULADOS:
                self.last_seed_generation_timestamp += DIA_EN_SEGUNDOS_SIMULADOS
                self.current_daily_random_seeds = self._generate_new_daily_seeds()
                
                self._procesar_fin_dia_eventos(current_processing_time) # Eventos basados en R4
                
                if not self.envejecer_y_verificar_muerte(): # Envejecer y chequear muerte
                    break # Detener si murió
                
                # Notificar al ambiente para posible reproducción (el ambiente decide)
                # print(f"    {self.nombre} completó día {self.edad_dias_completos}, notificando para reproducción.")
                # (Esto se manejará en el bucle principal de la simulación por ahora)


            # Evolucionar un timestep
            timestep_in_current_day = (self.edad_timesteps_evolutivos_total % TIMESTEPS_POR_DIA_SIMULADO)
            self._evolucion_un_timestep(timestep_in_current_day)
            
            current_processing_time += timestep_duration
            # Pequeño ajuste para evitar problemas de flotantes acumulados si procesamos muchos timesteps
            current_processing_time = round(current_processing_time, 4)


        self.last_evolution_processed_timestamp = min(current_processing_time, target_timestamp)
        return self.esta_viva

    def set_homeostasis_target(self, gen_nombre: str, valor: float, current_sim_time: float, costo_ep: float = 5.0) -> bool:
        self.actualizar_estado_hasta(current_sim_time, "internal_call") # Asegurar estado actualizado
        
        if self.puntos_evolucion < costo_ep:
            print(f"    {self.nombre} (a {current_sim_time:.2f}s): No hay suficientes EP ({self.puntos_evolucion:.2f}) para establecer objetivo homeostasis '{gen_nombre}' (costo: {costo_ep:.2f}).")
            return False

        if gen_nombre in GENES_VISIBLES_DEFAULT:
            min_val, max_val = GENES_VISIBLES_DEFAULT[gen_nombre]
            self.homeostasis_targets[gen_nombre] = clamp(valor, min_val, max_val)
            self.puntos_evolucion -= costo_ep # Restar EP
            print(f"    {self.nombre} (a {current_sim_time:.2f}s): Objetivo homeostasis para '{gen_nombre}' en {self.homeostasis_targets[gen_nombre]:.2f}. Costo: {costo_ep:.2f} EP. EP restantes: {self.puntos_evolucion:.2f}.")
            return True
        else:
            print(f"    ADVERTENCIA: Gen '{gen_nombre}' no es visible para homeostasis.")
            return False

    def display_estado(self, current_sim_time: float):
        # self.actualizar_estado_hasta(current_sim_time, "display_call") # Opcional: asegurar estado actualizado antes de mostrar
        print(f"\n--- Estado de {self.nombre} (ID: {self.id}) a t={current_sim_time:.2f}s ---")
        if not self.esta_viva: print("  ESTADO: MUERTA")
        print(f"  Nacimiento: {self.birth_timestamp:.2f}s, Ult.Proc: {self.last_evolution_processed_timestamp:.2f}s, Ult.Semillas: {self.last_seed_generation_timestamp:.2f}s")
        print(f"  Edad (días simulados): {self.edad_dias_completos:.2f} / {self.lifespan_total_dias:.2f}")
        print(f"  Timesteps evolutivos totales: {self.edad_timesteps_evolutivos_total}")
        print(f"  Puntos de Evolución: {self.puntos_evolucion:.2f}")
        print("  Genes Visibles:")
        for gen, valor in self.genes_visibles.items():
            target_info = f" (Obj.Homeo: {self.homeostasis_targets[gen]:.2f})" if gen in self.homeostasis_targets else ""
            val_str = f"{int(round(valor))}" if isinstance(GENES_VISIBLES_DEFAULT[gen][0], int) else f"{valor:.4f}"
            print(f"    {gen:<20} (V): {val_str}{target_info}")
        print("  Genes Ocultos:")
        for gen, valor in self.genes_ocultos.items(): print(f"    {gen:<20} (O): {valor:.4f}")
        print("------------------------------------")

class Ambiente:
    def __init__(self, id_usuario: str, current_sim_time: float):
        self.id_usuario = id_usuario
        self.criaturas: Dict[str, Criatura] = {}
        self.max_criaturas = MAX_CRIATURAS_POR_AMBIENTE
        self.dias_completados_para_reproduccion_check: Dict[str, float] = {} # criatura_id -> ultimo_dia_reproduccion_considerado
        print(f"Ambiente creado para {self.id_usuario} a t={current_sim_time:.2f}s")

    def add_criatura(self, criatura: Criatura):
        if len(self.criaturas) < self.max_criaturas:
            self.criaturas[criatura.id] = criatura
            print(f"  {criatura.nombre} añadida al ambiente de {self.id_usuario}.")
            self.dias_completados_para_reproduccion_check[criatura.id] = 0 # Iniciar para chequeo de reproducción
            return True
        print(f"  Ambiente lleno. No se pudo añadir a {criatura.nombre}.")
        return False

    def get_criaturas_vivas(self) -> List[Criatura]:
        return [c for c in self.criaturas.values() if c.esta_viva]

    def crear_y_add_criatura_inicial(self, nombre: str, current_sim_time: float):
        ep_inicial_rand = random.uniform(15.0, 25.0)
        nueva_criatura = Criatura(nombre=nombre, birth_timestamp=current_sim_time, ep_inicial=ep_inicial_rand)
        self.add_criatura(nueva_criatura)
        return nueva_criatura

    def intentar_reproduccion_ambiente(self, current_sim_time: float):
        # Este método ahora es más complejo porque la reproducción depende de que las criaturas
        # hayan completado un nuevo día SIMULADO, lo cual se sabe después de actualizar su estado.
        
        criaturas_elegibles_hoy = []
        for c_id, c in self.criaturas.items():
            if c.esta_viva and c.edad_dias_completos >= 1.0 and \
               c.genes_ocultos["fertilidad"] > 0.3 and \
               c.edad_dias_completos > self.dias_completados_para_reproduccion_check.get(c_id, -1.0):
                criaturas_elegibles_hoy.append(c)
        
        if len(criaturas_elegibles_hoy) < 2:
            return

        # Intentar emparejar aleatoriamente
        random.shuffle(criaturas_elegibles_hoy)
        for i in range(0, len(criaturas_elegibles_hoy) -1, 2):
            padre1 = criaturas_elegibles_hoy[i]
            padre2 = criaturas_elegibles_hoy[i+1]

            # Actualizar el día en que se consideró para reproducción
            self.dias_completados_para_reproduccion_check[padre1.id] = padre1.edad_dias_completos
            self.dias_completados_para_reproduccion_check[padre2.id] = padre2.edad_dias_completos

            if random.random() < PROBABILIDAD_REPRODUCCION_DIARIA_POR_PAREJA:
                prob_exito = (padre1.genes_ocultos["fertilidad"] + padre2.genes_ocultos["fertilidad"]) / 2
                if random.random() < prob_exito:
                    print(f"    ¡REPRODUCCIÓN en {self.id_usuario} a t={current_sim_time:.2f}s! {padre1.nombre} y {padre2.nombre} tuvieron cría.")
                    self._crear_descendencia(padre1, padre2, current_sim_time)
                    if len(self.criaturas) >= self.max_criaturas: break # Detener si el ambiente se llenó

    def _crear_descendencia(self, padre1: Criatura, padre2: Criatura, current_sim_time: float):
        if len(self.criaturas) >= self.max_criaturas: return

        nombre_cria = f"Cria_{padre1.nombre[:2]}{padre2.nombre[:2]}"
        ep_cria = max(5.0, (padre1.puntos_evolucion * 0.1 + padre2.puntos_evolucion * 0.1) + random.uniform(5,15))
        
        genes_p1_data = {'visibles': padre1.genes_visibles, 'ocultos': padre1.genes_ocultos}
        genes_p2_data = {'visibles': padre2.genes_visibles, 'ocultos': padre2.genes_ocultos}

        cria = Criatura(nombre=nombre_cria, birth_timestamp=current_sim_time, ep_inicial=ep_cria,
                        genes_padre1=genes_p1_data, genes_padre2=genes_p2_data)
        self.add_criatura(cria)

    def actualizar_todas_las_criaturas(self, current_sim_time: float):
        # print(f"  Ambiente {self.id_usuario}: Actualizando todas las criaturas a t={current_sim_time:.2f}s...")
        ids_criaturas_a_remover = []
        for c_id, criatura in list(self.criaturas.items()): # list() para poder remover durante iteración
            if not criatura.actualizar_estado_hasta(current_sim_time, self.id_usuario):
                if not criatura.esta_viva: # Si murió en esta actualización
                    ids_criaturas_a_remover.append(c_id)
        
        for c_id in ids_criaturas_a_remover:
            print(f"    Removiendo a {self.criaturas[c_id].nombre} (muerta) del ambiente {self.id_usuario}.")
            del self.criaturas[c_id]
            if c_id in self.dias_completados_para_reproduccion_check:
                 del self.dias_completados_para_reproduccion_check[c_id]


# --- Simulación Principal ---
def run_simulation(id_usuario: str, duracion_total_sim_seg: float, intervalo_actualizacion_seg: float, generate_graph: bool = True):
    random.seed(42)
    current_sim_time = 0.0

    ambiente_usuario = Ambiente(id_usuario, current_sim_time)

    # Crear criaturas iniciales
    nombres_iniciales = ["Sparky", "Blobby", "Zapper", "Wisp", "Glimmer"]
    for i in range(min(MAX_CRIATURAS_POR_AMBIENTE, len(nombres_iniciales))):
        ambiente_usuario.crear_y_add_criatura_inicial(nombres_iniciales[i], current_sim_time)
    
    print(f"\nEjecutando simulación para {id_usuario} por {duracion_total_sim_seg:.2f}s simulados, actualizando cada {intervalo_actualizacion_seg:.2f}s.")
    
    # Eventos de ejemplo (prompts de homeostasis)
    # Formato: (tiempo_sim_para_aplicar, nombre_criatura, gen, valor_objetivo)
    eventos_programados = [
        (DIA_EN_SEGUNDOS_SIMULADOS * 0.5, "Sparky", "tamañoBase", 0.80),
        (DIA_EN_SEGUNDOS_SIMULADOS * 0.7, "Blobby", "colorR", 0.90),
        (DIA_EN_SEGUNDOS_SIMULADOS * 1.5, "Sparky", "numApendices", 5.0),
        (DIA_EN_SEGUNDOS_SIMULADOS * 2.2, "Zapper", "colorG", 0.2),
    ]
    eventos_aplicados = [False] * len(eventos_programados)

    # Para gráfico de evolución
    if generate_graph:
        tiempos_grafico = []
        ep_por_criatura = {nombre: [] for nombre in nombres_iniciales}
        
    while current_sim_time < duracion_total_sim_seg:
        next_update_time = min(current_sim_time + intervalo_actualizacion_seg, duracion_total_sim_seg)
        print(f"\n--- Avanzando tiempo de simulación a: {next_update_time:.2f}s (Intervalo: {intervalo_actualizacion_seg:.2f}s) ---")

        # Actualizar todas las criaturas en el ambiente
        ambiente_usuario.actualizar_todas_las_criaturas(next_update_time)
        
        # Intentar reproducción (ahora que las criaturas están actualizadas)
        ambiente_usuario.intentar_reproduccion_ambiente(next_update_time)

        # Aplicar eventos programados (ej. prompts de homeostasis)
        for i, (t_evento, nombre_c, gen_e, val_e) in enumerate(eventos_programados):
            if not eventos_aplicados[i] and next_update_time >= t_evento:
                criatura_obj = next((c for c_id, c in ambiente_usuario.criaturas.items() if c.nombre == nombre_c and c.esta_viva), None)
                if criatura_obj:
                    # Ahora set_homeostasis_target devuelve True/False indicando éxito
                    if criatura_obj.set_homeostasis_target(gen_e, val_e, next_update_time): # Costo por defecto de 5.0 EP se usará
                        eventos_aplicados[i] = True
        
        # Recopilar datos para gráfico
        if generate_graph:
            tiempos_grafico.append(next_update_time / DIA_EN_SEGUNDOS_SIMULADOS)  # Convertir a días
            for nombre in nombres_iniciales:
                criatura = next((c for c_id, c in ambiente_usuario.criaturas.items() if c.nombre == nombre and c.esta_viva), None)
                if criatura:
                    ep_por_criatura[nombre].append(criatura.puntos_evolucion)
                else:
                    # Si la criatura ya no existe o está muerta
                    if ep_por_criatura[nombre]:  # Si hay datos previos
                        ep_por_criatura[nombre].append(None)  # Marcar como None para discontinuidad
                    else:
                        ep_por_criatura[nombre].append(0)  # Si nunca hubo datos
        
        current_sim_time = next_update_time

    print(f"\n--- Simulación de {duracion_total_sim_seg:.2f}s completada para {id_usuario} ---")
    print("\n--- Detalles Finales de las criaturas (vivas o recientemente muertas) ---")
    if ambiente_usuario.criaturas: # Mostrar todas las que quedaron en el ambiente
        for criatura_id in list(ambiente_usuario.criaturas.keys()):
             criatura = ambiente_usuario.criaturas.get(criatura_id)
             if criatura:
                criatura.actualizar_estado_hasta(duracion_total_sim_seg, ambiente_usuario.id_usuario) # Ultima actualización
                criatura.display_estado(duracion_total_sim_seg)
    else:
        print("Ninguna criatura en el ambiente al final.")
    
    # Generar y guardar gráfico
    if generate_graph:
        plt.figure(figsize=(12, 7))
        plt.style.use('dark_background')  # Fondo oscuro para un aspecto más místico
        
        # Colores y estilos para cada criatura
        colores = {
            "Sparky": "#FF5733",  # Rojo-naranja
            "Blobby": "#33FF57",  # Verde
            "Zapper": "#3357FF",  # Azul
            "Wisp": "#B433FF",    # Púrpura
            "Glimmer": "#FFD733"  # Amarillo-dorado
        }
        
        for nombre, eps in ep_por_criatura.items():
            # Filtrar los valores None para no dibujar líneas discontinuas
            x_vals = []
            y_vals = []
            
            for i, ep in enumerate(eps):
                if ep is not None:
                    x_vals.append(tiempos_grafico[i])
                    y_vals.append(ep)
                elif x_vals:  # Si hay puntos anteriores, dibujar lo que tenemos y reiniciar
                    plt.plot(x_vals, y_vals, '-', color=colores[nombre], linewidth=2.5, label=nombre if i == 0 else "")
                    x_vals = []
                    y_vals = []
            
            # Dibujar los puntos restantes
            if x_vals:
                plt.plot(x_vals, y_vals, '-', color=colores[nombre], linewidth=2.5, label=nombre)
                
        # Añadir elementos místicos al gráfico
        plt.title("ElementalStrikers: Evolution Points Over Time", fontsize=18, fontweight='bold')
        plt.xlabel("Time (Simulated Days)", fontsize=14)
        plt.ylabel("Evolution Energy (EP)", fontsize=14)
        plt.grid(True, linestyle='--', alpha=0.3)
        
        # Añadir eventos de homeostasis como puntos destacados
        for t_evento, nombre_c, gen_e, val_e in eventos_programados:
            t_dias = t_evento / DIA_EN_SEGUNDOS_SIMULADOS
            plt.axvline(x=t_dias, color='white', linestyle='--', alpha=0.3)
            plt.text(t_dias, plt.ylim()[1]*0.9, f"{nombre_c}'s Transformation", 
                     rotation=90, ha='right', va='top', alpha=0.7, fontsize=8)
        
        plt.legend(loc='upper left', frameon=True, framealpha=0.7)
        
        # Añadir marca de agua / mensaje promocional
        plt.figtext(0.5, 0.02, 
                   "#MayTheFlowBeWithYou - ElementalStrikers evolving on @flow_blockchain",
                   ha="center", fontsize=10, alpha=0.7)
        
        # Guardar y mostrar
        plt.tight_layout()
        plt.savefig("elemental_strikers_evolution.png", dpi=300, bbox_inches='tight')
        print("\n✨ Gráfico guardado como 'elemental_strikers_evolution.png' ✨")
        
        # Mensaje promocional para redes sociales
        promo_message = """
🌟 First glimpse into the ElementalStrikers universe! 🌟

Watch as our mystical creatures evolve through mathematical harmony, powered by Flow's blockchain energy.

Each line represents a unique being's journey toward enlightenment.

Full reveal coming soon... #MayTheFlowBeWithYou @flow_blockchain
        """
        
        print("\n=== MENSAJE PROMOCIONAL PARA REDES SOCIALES ===")
        print(promo_message)
        print("===============================================")
        
        plt.show()
    
    return ambiente_usuario

if __name__ == "__main__":
    USUARIO_ACTUAL = "JugadorDelta"
    # Simular 3 días (si DIA_EN_SEGUNDOS_SIMULADOS = 60s, entonces 180s total)
    DURACION_TOTAL_SIMULACION_SEGUNDOS = DIA_EN_SEGUNDOS_SIMULADOS * 3.5 
    # Con qué frecuencia "la UI consulta" o el backend actualiza masivamente.
    # Si es más corto que DIA_EN_SEGUNDOS_SIMULADOS, veremos evolución intra-día.
    INTERVALO_ACTUALIZACION_SEGUNDOS = DIA_EN_SEGUNDOS_SIMULADOS / 4 # Actualizar 4 veces por día simulado

    run_simulation(USUARIO_ACTUAL, DURACION_TOTAL_SIMULACION_SEGUNDOS, INTERVALO_ACTUALIZACION_SEGUNDOS)

    # Para probar una criatura aislada:
    # print("\n--- Test Criatura Aislada ---")
    # test_time = 0.0
    # c_test = Criatura("Testo", birth_timestamp=test_time)
    # c_test.display_estado(test_time)
    # test_time += DIA_EN_SEGUNDOS_SIMULADOS * 0.6
    # c_test.actualizar_estado_hasta(test_time, "test_env")
    # c_test.display_estado(test_time)
    # test_time += DIA_EN_SEGUNDOS_SIMULADOS * 0.6 # Cruzar el límite del día
    # c_test.actualizar_estado_hasta(test_time, "test_env")
    # c_test.display_estado(test_time)