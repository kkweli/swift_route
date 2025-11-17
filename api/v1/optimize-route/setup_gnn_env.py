"""
Setup script for GNN optimization environment
"""
import subprocess
import sys
import os


def check_python_version():
    """Ensure Python 3.11+"""
    if sys.version_info < (3, 11):
        print("Error: Python 3.11 or higher required")
        sys.exit(1)
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")


def install_dependencies():
    """Install required packages"""
    print("\nInstalling dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", 
            "requirements-gnn.txt"
        ])
        print("✓ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)


def create_directories():
    """Create necessary directories"""
    dirs = [
        'models',
        'checkpoints',
        'cache',
        'logs'
    ]
    for dir_name in dirs:
        os.makedirs(dir_name, exist_ok=True)
    print("✓ Directories created")


def check_gpu():
    """Check for GPU availability"""
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✓ GPU available: {torch.cuda.get_device_name(0)}")
            return True
        else:
            print("ℹ No GPU detected, using CPU")
            return False
    except ImportError:
        print("⚠ PyTorch not installed yet")
        return False


if __name__ == "__main__":
    print("SwiftRoute GNN Environment Setup")
    print("=" * 50)
    
    check_python_version()
    install_dependencies()
    create_directories()
    check_gpu()
    
    print("\n" + "=" * 50)
    print("✓ Setup complete!")
    print("\nNext steps:")
    print("1. Configure environment variables in .env")
    print("2. Run tests: python -m pytest tests/")
    print("3. Start development server")
