<template>
  <div
    class="flex flex-col h-full overflow-hidden bg-[#f7f9f6] font-['Inter'] text-[#2a2a2a]">

    <!-- ================= HEADER ================= -->

    <header
      class="bg-white px-6 pt-5 pb-5 shadow-sm border-b border-gray-100">

      <div class="flex items-center gap-4">

        <button
          @click="$router.back()"
          class="w-11 h-11 rounded-2xl bg-[#f7f9f6] hover:bg-gray-100 transition flex items-center justify-center">

          <svg xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.3">

            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 19l-7-7 7-7" />

          </svg>

        </button>

        <div>

          <h1 class="text-xl font-bold tracking-tight">
            Puntos Seguros
          </h1>

          <p class="text-sm text-gray-500 mt-0.5">
            Encontrá el botón antipánico más cercano
          </p>

        </div>

      </div>

    </header>

    <!-- ================= PANTALLA INICIAL ================= -->

    <div
      v-if="!ubicacionUsuario"
      class="flex-1 overflow-y-auto">

      <!-- Hero -->

      <section class="px-7 pt-10">

        <div
          class="bg-white rounded-[32px] shadow-lg px-7 py-8 text-center">

          <div
            class="mx-auto w-24 h-24 rounded-full bg-[#eaf4ff] flex items-center justify-center">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-11 h-11"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#3082e3"
              stroke-width="1.7">

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3C12 3 4 6.5 4 12v5.5l8 2.5 8-2.5V12C20 6.5 12 3 12 3z"/>

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12l2 2 4-4"/>

            </svg>

          </div>

          <h2
            class="mt-6 text-2xl font-bold leading-tight">

            Encontrá ayuda rápidamente

          </h2>

          <p
            class="mt-3 text-sm leading-relaxed text-gray-500">

            Buscá una dirección o utilizá tu ubicación actual para visualizar
            los Puntos Seguros cercanos.

          </p>

        </div>

      </section>

      <!-- Tarjeta de búsqueda -->

      <section class="px-7 mt-7">

        <div
          class="bg-white rounded-[28px] shadow-lg p-6">

          <label
            class="text-xs font-semibold uppercase tracking-wide text-gray-500">

            Dirección

          </label>

          <div class="relative mt-3">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#3082e3"
              stroke-width="2">

              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>

            </svg>

            <input
              v-model="direccionInput"
              @input="onInputChange"
              @keydown.enter="buscarDireccion"
              @focus="inputFocused=true"
              @blur="inputFocused=false"
              placeholder="Ej: Av. Corrientes 1200"

              class="w-full h-14 rounded-2xl border pl-14 pr-12 bg-[#fafafa] text-sm transition-all outline-none"

              :style="`border-color:${inputFocused ? '#3082e3' : '#ececec'};
              box-shadow:${inputFocused
              ? '0 0 0 4px rgba(48,130,227,.12)'
              : 'none'}`">

            <button
              v-if="direccionInput"
              @click="limpiarBusqueda"

              class="absolute right-4 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#666"
                stroke-width="2">

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"/>

              </svg>

            </button>

          </div>
              <!-- Autocomplete -->

              <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">

              <ul
                v-if="sugerencias.length"
                class="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">

                <li
                  v-for="s in sugerencias"
                  :key="s.place_id"
                  @click="seleccionarSugerencia(s)"
                  class="flex cursor-pointer items-start gap-3 px-5 py-4 transition hover:bg-[#eff6ff]">

                  <div
                    class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff]">

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="#3082e3"
                      stroke-width="2">

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>

                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0"/>

                    </svg>

                  </div>

                  <span
                    class="text-sm leading-6 text-[#2a2a2a]">

                    {{ s.display_name }}

                  </span>

                </li>

              </ul>

            </Transition>

            <!-- Botón principal -->

            <button
              @click="buscarDireccion"
              :disabled="cargandoBusqueda || !direccionInput.trim()"
              class="mt-6 flex h-14 w-full items-center justify-center rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              style="background:#3082e3; box-shadow:0 14px 30px rgba(48,130,227,.28);">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2">

                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0"/>

              </svg>

              {{ cargandoBusqueda ? 'Buscando...' : 'Buscar puntos seguros' }}

            </button>

            <!-- Separador -->

            <div class="my-7 flex items-center">

              <div class="h-px flex-1 bg-gray-200"></div>

              <span
                class="mx-5 text-xs font-medium uppercase tracking-widest text-gray-400">

                o

              </span>

              <div class="h-px flex-1 bg-gray-200"></div>

            </div>

            <!-- GPS -->

            <button
              @click="usarUbicacionActual"
              :disabled="cargandoGPS"
              class="flex w-full items-center justify-center gap-3 rounded-2xl border-2 bg-[#eff6ff] py-4 font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50"
              style="border-color:#3082e3;color:#3082e3;">

              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2">

                  <circle
                    cx="12"
                    cy="12"
                    r="3"/>

                  <path
                    stroke-linecap="round"
                    d="M12 2v2M12 20v2M2 12h2M20 12h2"/>

                </svg>

              </div>

              <div class="text-left">

                <p class="text-sm font-semibold">

                  {{ cargandoGPS
                    ? 'Obteniendo ubicación...'
                    : 'Usar mi ubicación actual' }}

                </p>

                <p class="text-xs opacity-70">

                  GPS del dispositivo

                </p>

              </div>

            </button>

            <!-- Error -->

            <Transition
              enter-active-class="transition duration-300"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0">

              <div
                v-if="error"
                class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">

                <div class="flex gap-3">

                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">

                    ⚠️

                  </div>

                  <div>

                    <p class="font-semibold text-red-700">

                      Ocurrió un problema

                    </p>

                    <p class="mt-1 text-sm text-red-600">

                      {{ error }}

                    </p>

                  </div>

                </div>

              </div>

            </Transition>

        </div>

      </section>

    </div>

    <!-- ================= RESULTADOS ================= -->

    <div
      v-if="ubicacionUsuario"
      class="flex flex-1 flex-col overflow-hidden bg-[#f7f9f6]">

      <!-- Barra superior -->

      <div
        class="mx-5 mt-5 rounded-3xl bg-white p-5 shadow-lg">

        <div class="flex items-start gap-3">

          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff]">

            📍

          </div>

          <div class="min-w-0 flex-1">

            <p class="text-xs uppercase tracking-wider text-gray-400">

              Ubicación

            </p>

            <p
              class="mt-1 break-words text-sm font-medium leading-6">

              {{ direccionInput }}

            </p>

          </div>

        </div>

        <button
          @click="nuevaBusqueda"
          class="mt-5 rounded-full bg-[#eff6ff] px-5 py-2 text-sm font-semibold transition hover:bg-blue-100"
          style="color:#3082e3;">

          Nueva búsqueda

        </button>

      </div>
    
      <!-- Mapa -->