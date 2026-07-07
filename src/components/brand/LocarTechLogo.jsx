export default function LocarTechLogo({
  width = 320,
  height,
  className = "",
  ...props
}) {
  const LOCAR_BLUE = "#7CC7EE";
  const TECH_WHITE = "#D2D9EA";

  return (
    <svg
      viewBox="0 0 791 790"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Locar Tech logo"
      className={className}
      shapeRendering="geometricPrecision"
      style={{
        width,
        height: height ?? "auto",
        display: "block",
      }}
      {...props}
    >
      {/* LOCAR */}
      <path
        id="locar_L"
        fill={LOCAR_BLUE}
        d="
          M134 229
          H166
          V309
          C166 338 184 355 211 355
          H228
          V386
          H201
          C160 386 134 360 134 323
          Z
        "
      />

      <path
        id="locar_o"
        fill={LOCAR_BLUE}
        fillRule="evenodd"
        d="
          M288.5 272
          C321 272 347 297.4 347 329.5
          C347 361.6 321 387 288.5 387
          C256 387 230 361.6 230 329.5
          C230 297.4 256 272 288.5 272
          Z

          M288.5 299
          C271.2 299 259 311.8 259 329.5
          C259 347.2 271.2 360 288.5 360
          C305.8 360 318 347.2 318 329.5
          C318 311.8 305.8 299 288.5 299
          Z
        "
      />

      <path
        id="locar_c"
        fill={LOCAR_BLUE}
        fillRule="evenodd"
        d="
          M472 302
          H441
          C436 296 428 299 417 299
          C399 299 387 311 387 329
          C387 347 399 360 417 360
          C429 360 438 356 444 347
          H473
          C465 371 443 386 416 386
          C383 386 358 361 358 329
          C358 297 383 272 416 272
          C444 272 465 286 472 302
          Z
        "
      />

      <path
        id="locar_a"
        fill={LOCAR_BLUE}
        fillRule="evenodd"
        d="
          M540 272
          C573 272 597 297 597 329
          V386
          H568
          V374
          C561 382 551 386 538 386
          C506 386 483 361 483 329
          C483 297 506 272 540 272
          Z

          M540 299
          C523 299 512 311 512 329
          C512 347 523 360 540 360
          C557 360 568 347 568 329
          C568 311 557 299 540 299
          Z
        "
      />

      <path
        id="locar_r"
        fill={LOCAR_BLUE}
        d="
          M613 273
          H643
          V288
          C651 279 664 273 683 273
          V303
          C661 303 643 316 643 338
          V386
          H613
          Z
        "
      />

      {/* TECH */}
      <path
        id="tech_t"
        fill="none"
        stroke={TECH_WHITE}
        strokeWidth="11"
        strokeLinecap="butt"
        strokeLinejoin="round"
        d="
          M214 432
          V535
          C214 560 229 569 260 569
          L273 566
        "
      />

      <path
        id="tech_t_cross"
        fill="none"
        stroke={TECH_WHITE}
        strokeWidth="11"
        strokeLinecap="butt"
        strokeLinejoin="round"
        d="M186 468 H273"
      />

      <path
        id="tech_e"
        fill="none"
        stroke={TECH_WHITE}
        strokeWidth="11"
        strokeLinecap="butt"
        strokeLinejoin="round"
        d="
          M391 520
          H291
          C293 486 315 466 342 466
          C373 466 392 488 392 520
          C392 553 370 570 342 570
          C316 570 294 555 290 531
        "
      />

      <path
        id="tech_c"
        fill="none"
        stroke={TECH_WHITE}
        strokeWidth="11"
        strokeLinecap="butt"
        strokeLinejoin="round"
        d="
          M520 493
          C509 475 490 466 469 466
          C439 466 415 489 415 518
          C415 549 439 570 469 570
          C491 570 510 560 520 543
        "
      />

      <path
        id="tech_h_stem"
        fill="none"
        stroke={TECH_WHITE}
        strokeWidth="11"
        strokeLinecap="butt"
        strokeLinejoin="round"
        d="M551 417 V573"
      />

      <path
        id="tech_h_arch"
        fill="none"
        stroke={TECH_WHITE}
        strokeWidth="11"
        strokeLinecap="butt"
        strokeLinejoin="round"
        d="
          M551 519
          C557 486 578 466 604 466
          C626 466 638 484 638 511
          V573
        "
      />
    </svg>
  );
}
